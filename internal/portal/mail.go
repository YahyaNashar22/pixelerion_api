package portal

import (
	"context"
	"crypto/rand"
	"crypto/tls"
	"database/sql"
	"fmt"
	"github.com/YahyaNashar22/pixelerion_api/internal/config"
	"log/slog"
	"net"
	"net/mail"
	"net/smtp"
	"strings"
	"time"
)

func enqueue(ctx context.Context, tx *sql.Tx, to, subject, body string, expiry ...string) error {
	expires := ""
	if len(expiry) > 0 {
		expires = expiry[0]
	}
	_, err := tx.ExecContext(ctx, "INSERT INTO email_outbox(id,recipient,subject,body,next_attempt,expires_at) VALUES(?,?,?,?,?,?)", rand.Text(), to, subject, body, stamp(), expires)
	return err
}

// RunMailer retries queued mail. Database transactions never wait on the SMTP network.
func RunMailer(ctx context.Context, db *sql.DB, cfg config.SMTPConfig, logger *slog.Logger) {
	if cfg.Username == "" {
		logger.Info("email delivery disabled; configure SMTP; requests remain in the admin inbox")
		return
	}
	ticker := time.NewTicker(15 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}
		if _, err := db.ExecContext(ctx, "UPDATE email_outbox SET body='',attempts=8,last_error='Reset email expired; request a new link' WHERE sent_at='' AND expires_at<>'' AND expires_at<=?", stamp()); err != nil {
			logger.Error("email expiry cleanup", "error", err)
		}
		rows, err := query(ctx, db, "SELECT id,recipient,subject,body,attempts FROM email_outbox WHERE sent_at='' AND next_attempt<=? AND attempts<8 AND (expires_at='' OR expires_at>?) ORDER BY rowid LIMIT 10", stamp(), stamp())
		if err != nil {
			logger.Error("email queue query", "error", err)
			continue
		}
		for _, row := range rows {
			if ctx.Err() != nil {
				return
			}
			err := sendMail(cfg, row["recipient"].(string), row["subject"].(string), row["body"].(string))
			if err != nil {
				attempts := int(row["attempts"].(int64)) + 1
				next := time.Now().UTC().Add(time.Duration(1<<min(attempts, 10)) * time.Minute).Format(time.RFC3339)
				_, saveErr := db.ExecContext(ctx, "UPDATE email_outbox SET attempts=?,next_attempt=?,last_error='SMTP delivery failed; check server logs/configuration' WHERE id=?", attempts, next, row["id"])
				if saveErr != nil {
					logger.Error("email retry persistence", "error", saveErr)
				}
				logger.Warn("email delivery failed", "message_id", row["id"])
			} else {
				// Remove reset links and support content once delivered.
				if _, err := db.ExecContext(ctx, "UPDATE email_outbox SET sent_at=?,body='',last_error='' WHERE id=?", stamp(), row["id"]); err != nil {
					logger.Error("email completion persistence", "error", err)
				}
			}
		}
	}
}
func sendMail(cfg config.SMTPConfig, to, subject, body string) error {
	if strings.ContainsAny(to+subject+cfg.From, "\r\n") {
		return fmt.Errorf("invalid mail header")
	}
	recipient, err := mail.ParseAddress(to)
	if err != nil {
		return err
	}
	from, err := mail.ParseAddress(cfg.From)
	if err != nil {
		return err
	}
	address := net.JoinHostPort(cfg.Host, cfg.Port)
	conn, err := net.DialTimeout("tcp", address, 10*time.Second)
	if err != nil {
		return err
	}
	defer conn.Close()
	conn.SetDeadline(time.Now().Add(20 * time.Second))
	client, err := smtp.NewClient(conn, cfg.Host)
	if err != nil {
		return err
	}
	defer client.Close()
	if err := client.StartTLS(&tls.Config{ServerName: cfg.Host, MinVersion: tls.VersionTLS12}); err != nil {
		return err
	}
	if err := client.Auth(smtp.PlainAuth("", cfg.Username, cfg.Password, cfg.Host)); err != nil {
		return err
	}
	if err := client.Mail(from.Address); err != nil {
		return err
	}
	if err := client.Rcpt(recipient.Address); err != nil {
		return err
	}
	writer, err := client.Data()
	if err != nil {
		return err
	}
	_, err = fmt.Fprintf(writer, "From: %s\r\nTo: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n%s", from.String(), recipient.String(), subject, strings.ReplaceAll(strings.ReplaceAll(body, "\r\n", "\n"), "\n", "\r\n"))
	if err != nil {
		writer.Close()
		return err
	}
	if err := writer.Close(); err != nil {
		return err
	}
	return client.Quit()
}
