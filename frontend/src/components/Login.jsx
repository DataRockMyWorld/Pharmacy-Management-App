import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axiosInstance from '../utils/axiosInstance';
import 'react-toastify/dist/ReactToastify.css'; // Import toastify CSS
import '../css/login.css'
import { useAuth } from '../utils/AuthContext';

const Login = () => {
    const navigate = useNavigate();
    const {login} = useAuth();
    const [logindata, setLogindata] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleOnchange = (e) => {
        setLogindata({ ...logindata, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { email, password } = logindata;
        if (!email || !password) {
            setError('All fields are required');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await login(email, password);
            toast.success('Login successful');
            
        } catch (err) {
            console.error('Login error:', err);
            setError('Invalid credentials. Please try again.');
            toast.error('Login failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container">
            <div className="main-content">
                <div className="main image-logo"></div>
                <div className="main text-content">
                    <div className="box-1">
                        <h3>LOG IN TO YOUR ACCOUNT</h3>
                    </div>
                    <div className="box-2">
                        <div className="form">
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label htmlFor="email">Email</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={logindata.email}
                                        onChange={handleOnchange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="password">Password</label>
                                    <input
                                        type="password"
                                        id="password"
                                        name="password"
                                        value={logindata.password}
                                        onChange={handleOnchange}
                                        required
                                    />
                                </div>
                                {error && <p style={{ color: 'red' }}>{error}</p>}
                                <button type="submit" disabled={isLoading}>
                                    {isLoading ? 'Logging in...' : 'Login'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;