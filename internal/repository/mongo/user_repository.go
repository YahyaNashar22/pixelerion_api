package mongo

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/YahyaNashar22/pixelerion_api/internal/domain"
	"github.com/YahyaNashar22/pixelerion_api/internal/repository"
	"go.mongodb.org/mongo-driver/v2/bson"
	mongoDriver "go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

type UserRepository struct {
	collection *mongoDriver.Collection
}

func NewUserRepository(
	db *mongoDriver.Database,
) *UserRepository {
	return &UserRepository{
		collection: db.Collection("users"),
	}
}

type userDocument struct {
	ID bson.ObjectID `bson:"_id,omitempty"`

	Username     string `bson:"username"`
	Email        string `bson:"email"`
	PasswordHash string `bson:"password_hash"`

	Role domain.UserRole `bson:"role"`

	ProjectIDs []bson.ObjectID `bson:"project_ids"`

	CreatedAt time.Time `bson:"created_at"`
	UpdatedAt time.Time `bson:"updated_at"`
}

func (r *UserRepository) Create(
	ctx context.Context,
	user *domain.User,
) error {
	doc := userDocument{
		Username:     user.Username,
		Email:        user.Email,
		PasswordHash: user.PasswordHash,
		Role:         user.Role,
		CreatedAt:    user.CreatedAt,
		UpdatedAt:    user.UpdatedAt,
		ProjectIDs:   []bson.ObjectID{},
	}
	result, err := r.collection.InsertOne(ctx, doc)
	if err != nil {
		if mongoDriver.IsDuplicateKeyError(err) {
			return repository.ErrConflict
		}

		return fmt.Errorf("insert user: %w", err)
	}

	id, ok := result.InsertedID.(bson.ObjectID)
	if !ok {
		return fmt.Errorf("unexpected inserted user id type")
	}

	user.ID = id.Hex()

	return nil
}

func (r *UserRepository) EnsureIndexes(
	ctx context.Context,
) error {
	models := []mongoDriver.IndexModel{
		{
			Keys: bson.D{
				{Key: "email", Value: 1},
			},
			Options: options.Index().SetUnique(true).SetName("users_email_unique"),
		},
		{
			Keys: bson.D{
				{Key: "username", Value: 1},
			},
			Options: options.Index().SetUnique(true).SetName("users_username_unique"),
		},
	}

	_, err := r.collection.Indexes().CreateMany(ctx, models)

	if err != nil {
		return fmt.Errorf(
			"create user indexes: %w", err,
		)
	}

	return nil
}

func (r *UserRepository) FindByEmail(
	ctx context.Context,
	email string,
) (*domain.User, error) {
	var doc userDocument

	err := r.collection.FindOne(ctx, bson.M{
		"email": email,
	}).Decode(&doc)

	if err != nil {
		if errors.Is(
			err,
			mongoDriver.ErrNoDocuments,
		) {
			return nil, repository.ErrNotFound
		}

		return nil, fmt.Errorf(
			"find user by email: %w", err,
		)
	}

	return documentToDomain(doc), nil
}

func (r *UserRepository) FindByUsername(
	ctx context.Context,
	username string,
) (*domain.User, error) {
	var doc userDocument

	err := r.collection.FindOne(ctx, bson.M{
		"username": username,
	}).Decode(&doc)

	if err != nil {
		if errors.Is(
			err,
			mongoDriver.ErrNoDocuments,
		) {
			return nil, repository.ErrNotFound
		}

		return nil, fmt.Errorf(
			"find user by username: %w", err,
		)
	}

	return documentToDomain(doc), nil
}

func documentToDomain(
	doc userDocument,
) *domain.User {
	projectIDs := make(
		[]string, 0, len(doc.ProjectIDs),
	)

	for _, id := range doc.ProjectIDs {
		projectIDs = append(projectIDs, id.Hex())
	}

	return &domain.User{
		ID:           doc.ID.Hex(),
		Username:     doc.Username,
		Email:        doc.Email,
		PasswordHash: doc.PasswordHash,
		Role:         doc.Role,
		ProjectIDs:   projectIDs,
		CreatedAt:    doc.CreatedAt,
		UpdatedAt:    doc.UpdatedAt,
	}
}
