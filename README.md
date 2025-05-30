# AI-Powered Resume Builder

A modern web application that helps users create professional resumes with AI-powered bullet point generation and multiple template options.

## Features

- User authentication with email verification
- Resume creation and management
- AI-powered bullet point generation for work experience
- Multiple resume templates (Modern, Classic, Minimal)
- Live resume preview
- PDF export functionality
- Responsive design
- Form validation
- Password reset functionality

## Tech Stack

### Frontend
- React.js
- Tailwind CSS
- React Router
- Axios
- React Toastify
- html2pdf.js

### Backend
- Node.js
- Express.js
- MongoDB
- JWT Authentication
- OpenAI API
- Nodemailer

## Project Structure

```
├── client/                 # Frontend React application
│   ├── public/            # Static files
│   └── src/
│       ├── components/    # Reusable components
│       ├── pages/        # Page components
│       ├── utils/        # Utility functions
│       ├── context/      # React context
│       └── App.js        # Main application component
│
├── server/                # Backend Node.js application
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Custom middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   └── server.js        # Server entry point
│
└── README.md
```

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- OpenAI API key
- SMTP server credentials for email functionality

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd resume-builder
```

2. Install server dependencies:
```bash
cd server
npm install
```

3. Install client dependencies:
```bash
cd ../client
npm install
```

4. Create a `.env` file in the server directory with the following variables:
```
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_api_key
SMTP_HOST=your_smtp_host
SMTP_PORT=your_smtp_port
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
FRONTEND_URL=http://localhost:3000
```

## Running the Application

1. Start the backend server:
```bash
cd server
npm run dev
```

2. Start the frontend development server:
```bash
cd client
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Known Issues and Limitations

1. **PDF Export**:
   - Some complex layouts might not render perfectly in the PDF
   - Font rendering might vary across different operating systems
   - Large resumes might take longer to generate PDFs

2. **AI Generation**:
   - Bullet point generation is limited to 3-5 points per experience
   - Response time depends on OpenAI API latency
   - Requires valid OpenAI API key

3. **Form Validation**:
   - Date validation could be more robust
   - URL validation might need adjustment for specific formats

4. **Performance**:
   - Large resumes might cause slight lag in the preview
   - PDF generation might be slow for complex resumes

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 