import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import userModel from "../models/userModel.js";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import { v2 as cloudinary } from 'cloudinary'
import stripe from "stripe";
import razorpay from 'razorpay';

// Gateway Initialize
const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY)
const razorpayInstance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
})

// Helper function to generate JWT token
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
};

// API to register user
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate input data
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        // Validate email format
        if (!validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: "Please enter a valid email" });
        }

        // Validate strong password
        if (password.length < 8) {
            return res.status(400).json({ success: false, message: "Password must be at least 8 characters long" });
        }

        // Check if user already exists
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ success: false, message: "User already exists with this email" });
        }

        // Hash user password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const userData = {
            name,
            email,
            password: hashedPassword,
        };

        const newUser = new userModel(userData);
        const user = await newUser.save();
        
        // Generate token
        const token = generateToken(user._id);

        // Remove password from response
        const userResponse = { ...user.toObject() };
        delete userResponse.password;

        res.status(201).json({ 
            success: true, 
            token,
            user: userResponse,
            message: 'User registered successfully'
        });

    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle duplicate email error
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: "User already exists with this email" });
        }
        
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// API to login user
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validate input data
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }

        // Find user by email
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        // Check if password matches
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        // Generate token with expiration
        const token = generateToken(user._id);

        // Remove password from response
        const userResponse = { ...user.toObject() };
        delete userResponse.password;

        res.json({ 
            success: true, 
            token,
            user: userResponse,
            message: 'Login successful'
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// API to get user profile data
const getProfile = async (req, res) => {
    try {
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({ success: false, message: "User ID is required" });
        }

        const userData = await userModel.findById(userId).select('-password');
        
        if (!userData) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.json({ success: true, userData });

    } catch (error) {
        console.error('Get profile error:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: "Invalid user ID" });
        }
        
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// API to update user profile
const updateProfile = async (req, res) => {
    try {
        const { userId, name, phone, address, dob, gender } = req.body;
        const imageFile = req.file;

        // Validate required fields
        if (!userId || !name || !phone || !dob || !gender) {
            return res.status(400).json({ success: false, message: "Required fields are missing" });
        }

        // Check if user exists
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Prepare update data
        const updateData = { name, phone, dob, gender };
        
        // Parse address if provided
        if (address) {
            try {
                updateData.address = typeof address === 'string' ? JSON.parse(address) : address;
            } catch (error) {
                return res.status(400).json({ success: false, message: "Invalid address format" });
            }
        }

        // Handle image upload if provided
        if (imageFile) {
            try {
                const imageUpload = await cloudinary.uploader.upload(imageFile.path, { 
                    resource_type: "image",
                    folder: "user-profiles" // Organize images in folder
                });
                updateData.image = imageUpload.secure_url;
            } catch (error) {
                console.error('Image upload error:', error);
                return res.status(500).json({ success: false, message: "Failed to upload image" });
            }
        }

        // Update user
        const updatedUser = await userModel.findByIdAndUpdate(
            userId, 
            updateData, 
            { new: true, runValidators: true }
        ).select('-password');

        res.json({ 
            success: true, 
            user: updatedUser,
            message: 'Profile updated successfully' 
        });

    } catch (error) {
        console.error('Update profile error:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: "Invalid user ID" });
        }
        
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// API to book appointment 
const bookAppointment = async (req, res) => {
    try {
        const { userId, docId, slotDate, slotTime } = req.body;

        // Validate input
        if (!userId || !docId || !slotDate || !slotTime) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const docData = await doctorModel.findById(docId).select("-password");
        if (!docData) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }

        if (!docData.available) {
            return res.status(400).json({ success: false, message: 'Doctor is not available' });
        }

        let slots_booked = docData.slots_booked || {};

        // Check for slot availability
        if (slots_booked[slotDate] && slots_booked[slotDate].includes(slotTime)) {
            return res.status(400).json({ success: false, message: 'Time slot is not available' });
        }

        // Reserve the slot
        if (!slots_booked[slotDate]) {
            slots_booked[slotDate] = [];
        }
        slots_booked[slotDate].push(slotTime);

        const userData = await userModel.findById(userId).select("-password");
        if (!userData) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Create appointment
        const appointmentData = {
            userId,
            docId,
            userData,
            docData: { ...docData.toObject(), slots_booked: undefined },
            amount: docData.fees,
            slotTime,
            slotDate,
            date: new Date()
        };

        const newAppointment = new appointmentModel(appointmentData);
        await newAppointment.save();

        // Update doctor's booked slots
        await doctorModel.findByIdAndUpdate(docId, { slots_booked });

        res.status(201).json({ 
            success: true, 
            appointment: newAppointment,
            message: 'Appointment booked successfully' 
        });

    } catch (error) {
        console.error('Book appointment error:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: "Invalid ID format" });
        }
        
        res.status(500).json({ success: false, message: "Failed to book appointment" });
    }
};

// API to cancel appointment
const cancelAppointment = async (req, res) => {
    try {
        const { userId, appointmentId } = req.body;

        if (!userId || !appointmentId) {
            return res.status(400).json({ success: false, message: 'User ID and appointment ID are required' });
        }

        const appointmentData = await appointmentModel.findById(appointmentId);
        if (!appointmentData) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        // Verify appointment ownership
        if (appointmentData.userId.toString() !== userId) {
            return res.status(403).json({ success: false, message: 'Unauthorized action' });
        }

        if (appointmentData.cancelled) {
            return res.status(400).json({ success: false, message: 'Appointment is already cancelled' });
        }

        // Cancel appointment
        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true, cancelledAt: new Date() });

        // Release doctor slot if not in past
        const appointmentDate = new Date(appointmentData.slotDate);
        const today = new Date();
        
        if (appointmentDate >= today) {
            const { docId, slotDate, slotTime } = appointmentData;
            const doctorData = await doctorModel.findById(docId);

            if (doctorData && doctorData.slots_booked && doctorData.slots_booked[slotDate]) {
                let slots_booked = doctorData.slots_booked;
                slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime);
                
                // Remove date entry if no slots left
                if (slots_booked[slotDate].length === 0) {
                    delete slots_booked[slotDate];
                }
                
                await doctorModel.findByIdAndUpdate(docId, { slots_booked });
            }
        }

        res.json({ success: true, message: 'Appointment cancelled successfully' });

    } catch (error) {
        console.error('Cancel appointment error:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: "Invalid ID format" });
        }
        
        res.status(500).json({ success: false, message: "Failed to cancel appointment" });
    }
};

// API to get user appointments for frontend my-appointments page
const listAppointment = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }

        const appointments = await appointmentModel.find({ userId }).sort({ date: -1 });

        res.json({ success: true, appointments });

    } catch (error) {
        console.error('List appointments error:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: "Invalid user ID" });
        }
        
        res.status(500).json({ success: false, message: "Failed to fetch appointments" });
    }
};

// API to make payment of appointment using razorpay
const paymentRazorpay = async (req, res) => {
    try {
        const { appointmentId } = req.body;

        if (!appointmentId) {
            return res.status(400).json({ success: false, message: 'Appointment ID is required' });
        }

        const appointmentData = await appointmentModel.findById(appointmentId);
        if (!appointmentData) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        if (appointmentData.cancelled) {
            return res.status(400).json({ success: false, message: 'Appointment is cancelled' });
        }

        if (appointmentData.payment) {
            return res.status(400).json({ success: false, message: 'Appointment is already paid' });
        }

        // Create Razorpay order
        const options = {
            amount: Math.round(appointmentData.amount * 100), // Convert to paise
            currency: process.env.CURRENCY || 'INR',
            receipt: appointmentId.toString(),
            payment_capture: 1
        };

        const order = await razorpayInstance.orders.create(options);

        res.json({ success: true, order });

    } catch (error) {
        console.error('Razorpay payment error:', error);
        res.status(500).json({ success: false, message: "Failed to create payment order" });
    }
};

// API to verify payment of razorpay
const verifyRazorpay = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Payment verification data is missing' });
        }

        // Verify payment signature
        const crypto = require('crypto');
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Payment verification failed' });
        }

        // Fetch order details
        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);

        if (orderInfo.status === 'paid') {
            await appointmentModel.findByIdAndUpdate(orderInfo.receipt, { 
                payment: true, 
                paymentId: razorpay_payment_id,
                paymentDate: new Date()
            });
            
            return res.json({ success: true, message: "Payment verified successfully" });
        } else {
            return res.json({ success: false, message: 'Payment not completed' });
        }

    } catch (error) {
        console.error('Razorpay verification error:', error);
        res.status(500).json({ success: false, message: "Payment verification failed" });
    }
};

// API to make payment of appointment using Stripe
const paymentStripe = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        const { origin } = req.headers;

        if (!appointmentId) {
            return res.status(400).json({ success: false, message: 'Appointment ID is required' });
        }

        const appointmentData = await appointmentModel.findById(appointmentId);
        if (!appointmentData) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        if (appointmentData.cancelled) {
            return res.status(400).json({ success: false, message: 'Appointment is cancelled' });
        }

        if (appointmentData.payment) {
            return res.status(400).json({ success: false, message: 'Appointment is already paid' });
        }

        const currency = (process.env.CURRENCY || 'usd').toLowerCase();

        const line_items = [{
            price_data: {
                currency,
                product_data: {
                    name: `Appointment with Dr. ${appointmentData.docData.name}`,
                    description: `Appointment on ${appointmentData.slotDate} at ${appointmentData.slotTime}`
                },
                unit_amount: Math.round(appointmentData.amount * 100), // Convert to cents
            },
            quantity: 1
        }];

        const session = await stripeInstance.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items,
            mode: 'payment',
            success_url: `${origin}/verify?success=true&appointmentId=${appointmentData._id}`,
            cancel_url: `${origin}/verify?success=false&appointmentId=${appointmentData._id}`,
            client_reference_id: appointmentId.toString(),
            metadata: {
                appointmentId: appointmentId.toString()
            }
        });

        res.json({ success: true, session_url: session.url });

    } catch (error) {
        console.error('Stripe payment error:', error);
        res.status(500).json({ success: false, message: "Failed to create payment session" });
    }
};

// API to verify Stripe payment
const verifyStripe = async (req, res) => {
    try {
        const { appointmentId, success } = req.body;

        if (!appointmentId) {
            return res.status(400).json({ success: false, message: 'Appointment ID is required' });
        }

        if (success === "true") {
            await appointmentModel.findByIdAndUpdate(appointmentId, { 
                payment: true, 
                paymentDate: new Date() 
            });
            return res.json({ success: true, message: 'Payment successful' });
        }

        res.json({ success: false, message: 'Payment failed or cancelled' });

    } catch (error) {
        console.error('Stripe verification error:', error);
        res.status(500).json({ success: false, message: 'Payment verification failed' });
    }
};

export {
    loginUser,
    registerUser,
    getProfile,
    updateProfile,
    bookAppointment,
    listAppointment,
    cancelAppointment,
    paymentRazorpay,
    verifyRazorpay,
    paymentStripe,
    verifyStripe
};