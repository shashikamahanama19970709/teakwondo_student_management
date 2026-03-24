# Help Line Academy - Healthcare Education Platform

## Overview

Help Line Academy is a comprehensive, self-hosted healthcare education platform designed specifically for healthcare professionals, caregivers, and medical institutions. Built with cutting-edge technologies, Help Line Academy provides a complete learning management system for healthcare training, certifications, and professional development.

## Key Features

- **Self-Hosted**: Complete control over your educational data with Docker-based deployment
- **Healthcare-Focused**: Specialized for healthcare education and training
- **Modern Stack**: Built with Next.js, Node.js, and MongoDB
- **Scalable**: Designed to grow with your institution and course offerings
- **Customizable**: Flexible architecture for custom curricula and integrations

## Technology Stack

- **Frontend**: Next.js 14 with TypeScript
- **Backend**: Next.js API routes with Server Actions
- **Database**: MongoDB with Mongoose ODM
- **Deployment**: Docker & Docker Compose
- **UI Framework**: shadcn/ui with Tailwind CSS
- **Authentication**: JWT-based authentication
- **Email**: SMTP and Azure Communication Services support

## Healthcare Education Features

### Course Management
- **Caregiver Training Programs**: NVQ Level 3 & 4 certifications
- **International Programs**: Israel Caregiver Course
- **Emergency Training**: First Aid & BLS certifications
- **Course Modules**: Structured learning paths with lessons
- **Progress Tracking**: Student progress and completion monitoring

### Certification System
- **Professional Certifications**: Government-accredited qualifications
- **Certificate Generation**: Automated certificate creation and delivery
- **Compliance Tracking**: Healthcare regulatory compliance management
- **Assessment System**: Quizzes, exams, and practical evaluations

### Learning Management
- **Interactive Lessons**: Multimedia content delivery
- **Student Dashboard**: Personalized learning experience
- **Instructor Tools**: Course creation and management tools
- **Progress Analytics**: Detailed learning analytics and reporting

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Git
- Node.js 18+ (for development)

### 1. Clone the Repository

```bash
git clone https://github.com/shashikamahanama19970709/Help_Academy.git
cd helplineacademy
```

### 2. Environment Configuration

```bash
cp env.example .env.local
# Edit .env.local with your configuration
```

### 3. Start with Docker

```bash
# Development
docker-compose -f docker-compose.dev.yml up -d

# Production
docker-compose up -d
```

### 4. Access the Application

- **Main Application**: `http://localhost:3000`
- **Setup Wizard**: `http://localhost:3000/setup`
- **Dashboard**: `http://localhost:3000/dashboard`
- **Login**: `http://localhost:3000/login`
- **Health Check**: `http://localhost:3000/api/health`

**Service Ports:**
- **Application**: `http://localhost:3000`
- **MongoDB**: `localhost:27018`
- **Redis**: `localhost:6380`

**Demo Credentials:**
- Email: `admin@helplineacademy.lk`
- Password: `admin123`

## Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Services

```bash
# Start MongoDB and Redis with Docker
docker-compose -f docker-compose.dev.yml up -d

# Start the development server
npm run dev
```

### 3. Database Setup

```bash
# Run database migrations
npm run db:migrate

# Seed development data
npm run db:seed
```

## Project Structure

```
helplineacademy/
├── src/
│   ├── app/                 # Next.js app directory
│   │   ├── api/            # API routes
│   │   ├── dashboard/      # Admin dashboard
│   │   ├── course-modules/ # Course management
│   │   ├── certifications/ # Certificate system
│   │   ├── lessons/        # Lesson management
│   │   ├── landing/        # Public landing page
│   │   └── setup/          # Setup wizard
│   ├── components/         # React components
│   │   ├── ui/             # Reusable UI components
│   │   ├── layout/         # Layout components
│   │   ├── dashboard/      # Dashboard components
│   │   └── courses/        # Course-related components
│   ├── lib/                # Utility libraries
│   ├── models/             # Database models
│   └── types/              # TypeScript types
├── docs/                   # Documentation
├── docker/                 # Docker configurations
└── scripts/               # Build and utility scripts
```

## Setup Wizard

The setup wizard guides you through:

1. **Database Configuration**: MongoDB connection setup
2. **Admin User Creation**: Create your administrator account
3. **Institution Setup**: Configure your healthcare institution details
4. **Email Service**: Optional email notification setup
5. **Course Initialization**: Set up initial course structure
6. **Completion**: Finalize setup and access dashboard

## Features

### Healthcare Education Management
- **Course Creation**: Design and manage healthcare training programs
- **Student Enrollment**: Student registration and management
- **Progress Tracking**: Monitor student learning progress
- **Certification Management**: Issue and track professional certifications
- **Assessment System**: Create quizzes, exams, and practical evaluations

### Learning Platform
- **Interactive Lessons**: Multimedia content delivery system
- **Module Organization**: Structured course modules and lessons
- **Student Dashboard**: Personalized learning experience
- **Progress Analytics**: Detailed learning analytics and reporting
- **Mobile Learning**: Responsive design for mobile devices

### Administrative Tools
- **Institution Management**: Multi-institution support
- **User Role Management**: Admin, instructor, and student roles
- **Course Analytics**: Comprehensive reporting and insights
- **Compliance Tracking**: Healthcare regulatory compliance
- **Certificate Generation**: Automated certificate creation

### Technical Architecture
- **Micro Frontend**: Modular frontend architecture
- **Redis Caching**: Session management and data caching
- **Background Jobs**: Queue-based job processing
- **Email Integration**: SMTP and Azure Communication Services
- **Modern UI**: Tailwind CSS with Lucide icons
- **Setup Wizard**: WordPress-style installation process

## API Endpoints

### Setup Wizard
- `GET /api/setup/status` - Check setup completion status
- `POST /api/setup/database/test` - Test database connection
- `POST /api/setup/email/test` - Test email configuration
- `POST /api/setup/complete` - Complete setup process

### Authentication
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Course Management
- `GET /api/course-modules` - List all course modules
- `POST /api/course-modules` - Create new course module
- `GET /api/course-modules/[id]` - Get course module details
- `PUT /api/course-modules/[id]` - Update course module
- `DELETE /api/course-modules/[id]` - Delete course module

### Certification System
- `GET /api/certifications` - List all certifications
- `POST /api/certifications` - Issue new certification
- `GET /api/certifications/[id]` - Get certification details
- `PUT /api/certifications/[id]` - Update certification

### Student Management
- `GET /api/students` - List all students
- `POST /api/students` - Register new student
- `GET /api/students/[id]` - Get student details
- `PUT /api/students/[id]` - Update student information

## Docker Configuration

### Development
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### Production
```bash
docker-compose up -d
```

## Environment Variables

### Required
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT secret key
- `REFRESH_TOKEN_SECRET` - Refresh token secret

### Optional
- `REDIS_URL` - Redis connection string
- `SMTP_HOST` - SMTP server host
- `SMTP_USER` - SMTP username
- `SMTP_PASS` - SMTP password
- `INSTITUTION_NAME` - Healthcare institution name
- `CERTIFICATE_ISSUER` - Certificate issuing authority

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Check the documentation in the `docs/` folder
- Join our community discussions

---

**Help Line Academy** - Empowering healthcare professionals through quality education.