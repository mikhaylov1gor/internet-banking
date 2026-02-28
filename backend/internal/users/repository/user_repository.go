package repository

import (
	"internet-bank/internal/users/entity"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserRepository interface {
	Create(u *entity.User) error
	GetByID(id uuid.UUID) (*entity.User, error)
	GetByEmail(email string) (*entity.User, error)
	List(userType *entity.UserType, status *entity.UserStatus, limit, offset int) ([]*entity.User, error)
	Update(u *entity.User) error
}

type userRepo struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepo{db: db}
}

func (r *userRepo) Create(u *entity.User) error {
	return r.db.Create(u).Error
}

func (r *userRepo) GetByID(id uuid.UUID) (*entity.User, error) {
	var u entity.User
	err := r.db.Where("id = ?", id).First(&u).Error
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *userRepo) GetByEmail(email string) (*entity.User, error) {
	var u entity.User
	err := r.db.Where("email = ?", email).First(&u).Error
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *userRepo) List(userType *entity.UserType, status *entity.UserStatus, limit, offset int) ([]*entity.User, error) {
	if limit <= 0 {
		limit = 100
	}
	if offset < 0 {
		offset = 0
	}
	var list []*entity.User
	q := r.db.Model(&entity.User{})
	if userType != nil {
		q = q.Where("type = ?", *userType)
	}
	if status != nil {
		q = q.Where("status = ?", *status)
	}
	err := q.Order("created_at DESC").Offset(offset).Limit(limit).Find(&list).Error
	return list, err
}

func (r *userRepo) Update(u *entity.User) error {
	return r.db.Save(u).Error
}
