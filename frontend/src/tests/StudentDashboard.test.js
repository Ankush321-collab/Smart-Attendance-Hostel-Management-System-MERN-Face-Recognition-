import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import StudentDashboard from '../pages/StudentDashboard';

// Mock the contexts
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      name: 'Test Student',
      studentId: 'ST001',
      department: 'Computer Science'
    }
  })
}));

jest.mock('../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light'
  })
}));

// Mock the API services
jest.mock('../services/api', () => ({
  attendanceAPI: {
    getMyAttendance: jest.fn().mockResolvedValue({
      data: {
        data: [],
        statistics: {
          totalDays: 30,
          presentDays: 25,
          attendancePercentage: 83.33
        }
      }
    })
  },
  faceAPI: {
    getFaceStatus: jest.fn().mockResolvedValue({
      data: {
        data: { isFaceEnrolled: false }
      }
    })
  },
  mealAPI: {
    getPlans: jest.fn().mockResolvedValue({
      data: { data: [] }
    })
  },
  hostelAPI: {
    getMyRoom: jest.fn().mockResolvedValue({
      data: { data: null }
    })
  }
}));

// Mock Navbar component
jest.mock('../components/Navbar', () => {
  return function MockNavbar() {
    return <div data-testid="navbar">Navbar</div>;
  };
});

describe('StudentDashboard', () => {
  it('renders without crashing', () => {
    render(
      <BrowserRouter>
        <StudentDashboard />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Welcome, Test Student!/)).toBeInTheDocument();
    expect(screen.getByText(/Student ID:/)).toBeInTheDocument();
    expect(screen.getByText(/Computer Science/)).toBeInTheDocument();
  });

  it('displays face enrollment alert when not enrolled', () => {
    render(
      <BrowserRouter>
        <StudentDashboard />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Face Enrollment Required/)).toBeInTheDocument();
    expect(screen.getByText(/Enroll Now/)).toBeInTheDocument();
  });

  it('displays statistics cards', () => {
    render(
      <BrowserRouter>
        <StudentDashboard />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Total Days/)).toBeInTheDocument();
    expect(screen.getByText(/Present Days/)).toBeInTheDocument();
    expect(screen.getByText(/Attendance Rate/)).toBeInTheDocument();
  });

  it('displays quick action buttons', () => {
    render(
      <BrowserRouter>
        <StudentDashboard />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Enroll Face/)).toBeInTheDocument();
    expect(screen.getByText(/Mark Attendance/)).toBeInTheDocument();
    expect(screen.getByText(/Meal Portal/)).toBeInTheDocument();
  });
});