package httpserver

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/YahyaNashar22/pixelerion_api/internal/config"
)

type Server struct {
	server *http.Server
}

func New(cfg *config.Config) *Server {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /health", healthHandler)

	httpServer := &http.Server{
		Addr:    ":" + cfg.HTTP.Port,
		Handler: mux,

		//  Limits the total time allowed to read the entire request
		// It prevents clients from hanging up the server while uploading massive or trickling data streams
		ReadTimeout: cfg.HTTP.ReadTimeout,

		//Limits the amount of time the server will wait to read just the HTTP request headers
		// This the primary defense against Slowloris attacks
		ReadHeaderTimeout: cfg.HTTP.ReadHeaderTimeout,

		// Limits the amount of time the server has to write the response back to the client
		// If a client has a terribly slow download speed, or if your handler gets stuck processing a heavy database query before writing a response, this ensures the connection doesn't stay open forever
		WriteTimeout: cfg.HTTP.WriteTimeout,

		// Controls how long a Keep-Alive connection can stay open while waiting for the next request.
		// Reusing connections saves CPU and latency, but leaving them open indefinitely would quickly exhaust the server's maximum open file descriptors.
		IdleTimeout: cfg.HTTP.IdleTimeout,
	}

	return &Server{
		server: httpServer,
	}
}

func (s *Server) Start() error {
	return s.server.ListenAndServe()
}

func (s *Server) Shutdown(ctx context.Context) error {
	return s.server.Shutdown(ctx)
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	_ = json.NewEncoder(w).Encode(map[string]string{
		"status": "ok",
	})
}
