package usecase

import (
	"errors"

	"internet-bank/internal/users/entity"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrUserNotFound = errors.New("пользователь не найден")
	ErrEmailExists  = errors.New("пользователь с таким email уже существует")
)

type UserRepository interface {
	Create(u *entity.User) error
	GetByID(id uuid.UUID) (*entity.User, error)
	GetByEmail(email string) (*entity.User, error)
	List(userType *entity.UserType, status *entity.UserStatus, limit, offset int) ([]*entity.User, error)
	Update(u *entity.User) error
}

type UserUseCase struct {
	repo UserRepository
}

func NewUserUseCase(repo UserRepository) *UserUseCase {
	return &UserUseCase{repo: repo}
}

func (uc *UserUseCase) Create(userType entity.UserType, email, fullName, phone, password string) (*entity.User, error) {
	_, err := uc.repo.GetByEmail(email)
	if err == nil {
		return nil, ErrEmailExists
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	u := &entity.User{
		ID:           uuid.New(),
		Type:         userType,
		Email:        email,
		PasswordHash: string(hash),
		FullName:     fullName,
		Phone:        phone,
		Status:       entity.UserStatusActive,
	}
	if err := uc.repo.Create(u); err != nil {
		return nil, err
	}
	return u, nil
}

func (uc *UserUseCase) GetByID(id uuid.UUID) (*entity.User, error) {
	return uc.repo.GetByID(id)
}

func (uc *UserUseCase) List(userType *entity.UserType, status *entity.UserStatus, limit, offset int) ([]*entity.User, error) {
	return uc.repo.List(userType, status, limit, offset)
}

func (uc *UserUseCase) Block(userID uuid.UUID) error {
	u, err := uc.repo.GetByID(userID)
	if err != nil {
		return ErrUserNotFound
	}
	u.Status = entity.UserStatusBlocked
	return uc.repo.Update(u)
}

func (uc *UserUseCase) Unblock(userID uuid.UUID) error {
	u, err := uc.repo.GetByID(userID)
	if err != nil {
		return ErrUserNotFound
	}
	u.Status = entity.UserStatusActive
	return uc.repo.Update(u)
}
