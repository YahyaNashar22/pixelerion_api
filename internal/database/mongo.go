package database

import (
	"context"
	"fmt"

	"github.com/YahyaNashar22/pixelerion_api/internal/config"

	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

type Mongo struct {
	Client   *mongo.Client
	Database *mongo.Database
}

func ConnectMongo(
	ctx context.Context,
	cfg config.MongoConfig,
) (*Mongo, error) {
	serverAPI := options.ServerAPI(options.ServerAPIVersion1)

	clientOptions := options.Client().ApplyURI(cfg.URI).SetServerAPIOptions(serverAPI)

	client, err := mongo.Connect(clientOptions)
	if err != nil {
		return nil, fmt.Errorf(
			"connect to mongodb: %w",
			err,
		)
	}

	if err := client.Ping(ctx, nil); err != nil {
		_ = client.Disconnect(context.Background())

		return nil, fmt.Errorf(
			"ping mongodb: %w",
			err,
		)
	}

	return &Mongo{
		Client:   client,
		Database: client.Database(cfg.Database),
	}, nil
}

func (m *Mongo) Disconnect(ctx context.Context) error {
	if err := m.Client.Disconnect(ctx); err != nil {
		return fmt.Errorf(
			"disconnect mongodb: %w",
			err,
		)
	}

	return nil
}
