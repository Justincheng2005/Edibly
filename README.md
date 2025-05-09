# Edibly - Campus Dining Application

Edibly is a web-based dietary profiling app that helps users navigate local dining options based on their dietary needs/allergies, and preferences. The platform allows users to create a profile, specify allergies with severity levels, and receive personalized dining recommendations across the Five Colleges.

## Features

- Browse dining halls by college
- View dining hall details and hours
- Search for meals 
- User profiles 

## Project Structure

- `client/` - React frontend
- `server/` - Express backend API
- `server/db/` - Database connection and setup scripts

## Setup Instructions

### Prerequisites

- Node.js (v14+)
- npm or yarn

### Environment Variables

Create a `.env` file in the `server/` directory with the following variables:

```
PORT=3000
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
DATABASE_URL=your_database_url
AUTH0_DOMAIN=your_auth0_domain
AUTH0_AUDIENCE=your_auth0_audience
```

### Installation

1. Clone the repository
2. Install backend dependencies:
   ```
   cd server
   npm install
   ```
3. Install frontend dependencies:
   ```
   cd client
   npm install
   ```

### Running the Application

1. Start the backend server:
   ```
   cd server
   npm run dev
   ```

2. In a separate terminal, start the frontend:
   ```
   cd client
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

This project is licensed under the MIT License.
