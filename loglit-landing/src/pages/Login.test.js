import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Login from './Login';

describe('Login Component', () => {
  test('renders login form with email and password fields', () => {
    render(<Login />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  test('renders a submit button', () => {
    render(<Login />);
    
    const submitButton = screen.getByRole('button', { name: /login/i });
    expect(submitButton).toBeInTheDocument();
  });

  test('allows user to type in email field', async () => {
    render(<Login />);
    
    const emailInput = screen.getByLabelText(/email/i);
    await userEvent.type(emailInput, 'test@example.com');
    
    expect(emailInput).toHaveValue('test@example.com');
  });

  test('allows user to type in password field', async () => {
    render(<Login />);
    
    const passwordInput = screen.getByLabelText(/password/i);
    await userEvent.type(passwordInput, 'password123');
    
    expect(passwordInput).toHaveValue('password123');
  });

  test('password field has type password', () => {
    render(<Login />);
    
    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('calls onSubmit handler when form is submitted', async () => {
    const mockSubmit = jest.fn();
    render(<Login onSubmit={mockSubmit} />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });
    
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(submitButton);
    
    expect(mockSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
  });

  test('prevents default form submission behavior', async () => {
    render(<Login />);
    
    const form = screen.getByRole('form');
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    const preventDefaultSpy = jest.spyOn(submitEvent, 'preventDefault');
    
    fireEvent(form, submitEvent);
    
    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  test('displays validation error when email is empty', async () => {
    render(<Login />);
    
    const submitButton = screen.getByRole('button', { name: /login/i });
    await userEvent.click(submitButton);
    
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
  });

  test('displays validation error when password is empty', async () => {
    render(<Login />);
    
    const emailInput = screen.getByLabelText(/email/i);
    await userEvent.type(emailInput, 'test@example.com');
    
    const submitButton = screen.getByRole('button', { name: /login/i });
    await userEvent.click(submitButton);
    
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });

  test('displays validation error for invalid email format', async () => {
    render(<Login />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    await userEvent.type(emailInput, 'invalid-email');
    await userEvent.type(passwordInput, 'password123');
    
    const submitButton = screen.getByRole('button', { name: /login/i });
    await userEvent.click(submitButton);
    
    expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
  });
});
