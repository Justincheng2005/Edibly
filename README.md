# Edibly - Campus Dining Application

Edibly is a web application that helps students find and explore dining options across campuses in the Five College Consortium.

## Features

- Browse dining halls by college
- View dining hall details and hours
- Search for meals (coming soon)
- User profiles (coming soon)

## Project Structure

- `client/` - React frontend
- `server/` - Express backend API
- `server/db/` - Database connection and setup scripts

## Setup Instructions

### Prerequisites

- Node.js (v14+)
- npm or yarn
- Supabase account (project already set up with dininglocations table)

### Environment Variables

Create a `.env` file in the server directory with the following variables:

```
PORT=3000
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
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
   npm start
   ```

2. In a separate terminal, start the frontend:
   ```
   cd client
   npm start
   ```

3. Open your browser and navigate to `http://localhost:3000`

## Dining Halls Data Structure

The application uses the existing `dininglocations` table in Supabase with the following fields:

- `id`: Unique identifier
- `name`: Name of the dining hall
- `hours`: Operating hours for the dining hall
- `school`: Associated college/university
- Additional fields like comments, ratings, etc.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

This project is licensed under the MIT License.
