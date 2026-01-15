import nodemailer from 'nodemailer';
import config from '../config/index.js';
import logger from '../config/logger.js';

class EmailService {
    constructor() {
        this.transporter = null;
        this.init();
    }
    
    init() {
        if (config.email.host && config.email.user && config.email.password) {
            this.transporter = nodemailer.createTransport({
                host: config.email.host,
                port: config.email.port || 587,
                secure: config.email.port === 465,
                auth: {
                    user: config.email.user,
                    pass: config.email.password
                }
            });
            logger.info('Email service initialized');
        } else {
            logger.warn('Email service not configured. Using mock mode.');
            this.transporter = {
                sendMail: (options) => {
                    logger.info('Mock email sent:', {
                        to: options.to,
                        subject: options.subject
                    });
                    return Promise.resolve();
                }
            };
        }
    }
    
    async sendWelcomeEmail(user) {
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
                    .content { padding: 30px; background: #f9f9f9; }
                    .footer { text-align: center; padding: 20px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Welcome to Coding Judge! 🎉</h1>
                    </div>
                    <div class="content">
                        <h2>Hello ${user.username},</h2>
                        <p>Thank you for registering with Coding Judge. We're excited to have you on board!</p>
                        <p>Here are some things you can do:</p>
                        <ul>
                            <li>Solve coding problems across various difficulty levels</li>
                            <li>Track your progress with detailed statistics</li>
                            <li>Compete with other developers</li>
                            <li>Improve your problem-solving skills</li>
                        </ul>
                        <p>Start your coding journey by solving your first problem!</p>
                        <p style="text-align: center;">
                            <a href="${config.frontend.url}/problems" 
                               style="background: #4F46E5; color: white; padding: 12px 24px; 
                                      text-decoration: none; border-radius: 5px; display: inline-block;">
                                Start Coding Now
                            </a>
                        </p>
                    </div>
                    <div class="footer">
                        <p>Happy Coding!<br>The Coding Judge Team</p>
                        <p><small>If you didn't create this account, please ignore this email.</small></p>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        await this.sendEmail({
            to: user.email,
            subject: 'Welcome to Coding Judge!',
            html
        });
    }
    
    async sendPasswordResetEmail(user, resetToken) {
        const resetUrl = `${config.frontend.passwordResetUrl}?token=${resetToken}`;
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; }
                    .button { background: #4F46E5; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 5px; display: inline-block; }
                </style>
            </head>
            <body>
                <h2>Password Reset Request</h2>
                <p>Hello ${user.username},</p>
                <p>You requested to reset your password. Click the button below to proceed:</p>
                <p><a href="${resetUrl}" class="button">Reset Password</a></p>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this, please ignore this email.</p>
            </body>
            </html>
        `;
        
        await this.sendEmail({
            to: user.email,
            subject: 'Password Reset Request - Coding Judge',
            html
        });
    }
    
    async sendEmail(options) {
        try {
            const mailOptions = {
                from: config.email.from,
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text || options.html.replace(/<[^>]*>/g, '')
            };
            
            await this.transporter.sendMail(mailOptions);
            logger.info(`Email sent to ${options.to}`);
            
            return true;
        } catch (error) {
            logger.error('Failed to send email:', error);
            throw new Error('Failed to send email');
        }
    }
}

export default new EmailService();