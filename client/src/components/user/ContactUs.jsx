import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle, AlertCircle } from 'lucide-react';
import Navbar from "../layout/navbar";

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' or 'error'

  // Validation function
  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Subject validation
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    } else if (formData.subject.trim().length < 3) {
      newErrors.subject = 'Subject must be at least 3 characters';
    }

    // Message validation
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Simulate API call - Replace with actual backend endpoint
      // const response = await fetch('/api/contact', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // });

      // Simulate successful submission
      await new Promise(resolve => setTimeout(resolve, 1500));

      setSubmitStatus('success');
      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });

      // Hide success message after 5 seconds
      setTimeout(() => {
        setSubmitStatus(null);
      }, 5000);

    } catch (error) {
      console.error('Error submitting contact form:', error);
      setSubmitStatus('error');
      
      // Hide error message after 5 seconds
      setTimeout(() => {
        setSubmitStatus(null);
      }, 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      
      <main className="min-h-screen bg-[#FCFCF9] px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-[#134252] mb-4">
              Contact Us
            </h1>
            <p className="text-lg text-[#626C71] max-w-2xl mx-auto">
              Have a question or need help? We're here to assist you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>

          {/* Success/Error Messages */}
          {submitStatus === 'success' && (
            <div className="max-w-3xl mx-auto mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3 animate-fadeIn">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-900 mb-1">Message Sent Successfully!</h3>
                <p className="text-sm text-green-700">
                  Thank you for contacting us. We've received your message and will get back to you within 24-48 hours.
                </p>
              </div>
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="max-w-3xl mx-auto mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 animate-fadeIn">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Error Sending Message</h3>
                <p className="text-sm text-red-700">
                  Sorry, there was an error sending your message. Please try again or contact us directly using the information below.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Information */}
            <div className="lg:col-span-1 space-y-6">
              {/* Contact Details Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-[#134252] mb-4">
                  Contact Information
                </h2>
                
                <div className="space-y-4">
                  {/* Email */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-[#C0152F]/10 rounded-lg">
                      <Mail className="w-5 h-5 text-[#C0152F]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[#134252] mb-1">Email</h3>
                      <a 
                        href="mailto:support@ifind.com" 
                        className="text-sm text-[#626C71] hover:text-[#C0152F] transition-colors"
                      >
                        support@ifind.com
                      </a>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-[#C0152F]/10 rounded-lg">
                      <Phone className="w-5 h-5 text-[#C0152F]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[#134252] mb-1">Phone</h3>
                      <a 
                        href="tel:+1234567890" 
                        className="text-sm text-[#626C71] hover:text-[#C0152F] transition-colors"
                      >
                        +1 (234) 567-8900
                      </a>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-[#C0152F]/10 rounded-lg">
                      <MapPin className="w-5 h-5 text-[#C0152F]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[#134252] mb-1">Office</h3>
                      <p className="text-sm text-[#626C71]">
                        Bukidnon State University<br />
                        Malaybalay City, Bukidnon<br />
                        Philippines
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Office Hours */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-[#134252] mb-4">
                  Office Hours
                </h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#626C71]">Monday - Friday</span>
                    <span className="font-medium text-[#134252]">8:00 AM - 5:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#626C71]">Saturday</span>
                    <span className="font-medium text-[#134252]">9:00 AM - 2:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#626C71]">Sunday</span>
                    <span className="font-medium text-[#134252]">Closed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <h2 className="text-2xl font-semibold text-[#134252] mb-6">
                  Send us a Message
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                  {/* Name Field */}
                  <div>
                    <label 
                      htmlFor="name" 
                      className="block text-sm font-medium text-[#134252] mb-2"
                    >
                      Full Name <span className="text-[#C0152F]">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                        errors.name
                          ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                          : 'border-[#5E5240]/20 focus:ring-[#21808D]/20 focus:border-[#21808D]'
                      }`}
                      placeholder="Enter your full name"
                      aria-required="true"
                      aria-invalid={errors.name ? 'true' : 'false'}
                      aria-describedby={errors.name ? 'name-error' : undefined}
                    />
                    {errors.name && (
                      <p id="name-error" className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div>
                    <label 
                      htmlFor="email" 
                      className="block text-sm font-medium text-[#134252] mb-2"
                    >
                      Email Address <span className="text-[#C0152F]">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                        errors.email
                          ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                          : 'border-[#5E5240]/20 focus:ring-[#21808D]/20 focus:border-[#21808D]'
                      }`}
                      placeholder="your.email@example.com"
                      aria-required="true"
                      aria-invalid={errors.email ? 'true' : 'false'}
                      aria-describedby={errors.email ? 'email-error' : undefined}
                    />
                    {errors.email && (
                      <p id="email-error" className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Subject Field */}
                  <div>
                    <label 
                      htmlFor="subject" 
                      className="block text-sm font-medium text-[#134252] mb-2"
                    >
                      Subject <span className="text-[#C0152F]">*</span>
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                        errors.subject
                          ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                          : 'border-[#5E5240]/20 focus:ring-[#21808D]/20 focus:border-[#21808D]'
                      }`}
                      placeholder="What is your inquiry about?"
                      aria-required="true"
                      aria-invalid={errors.subject ? 'true' : 'false'}
                      aria-describedby={errors.subject ? 'subject-error' : undefined}
                    />
                    {errors.subject && (
                      <p id="subject-error" className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.subject}
                      </p>
                    )}
                  </div>

                  {/* Message Field */}
                  <div>
                    <label 
                      htmlFor="message" 
                      className="block text-sm font-medium text-[#134252] mb-2"
                    >
                      Message <span className="text-[#C0152F]">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={6}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all resize-none ${
                        errors.message
                          ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                          : 'border-[#5E5240]/20 focus:ring-[#21808D]/20 focus:border-[#21808D]'
                      }`}
                      placeholder="Please describe your inquiry in detail..."
                      aria-required="true"
                      aria-invalid={errors.message ? 'true' : 'false'}
                      aria-describedby={errors.message ? 'message-error' : undefined}
                    />
                    {errors.message && (
                      <p id="message-error" className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.message}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-[#626C71]">
                      {formData.message.length} / 500 characters
                    </p>
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-center justify-between pt-4">
                    <p className="text-sm text-[#626C71]">
                      <span className="text-[#C0152F]">*</span> Required fields
                    </p>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition-all shadow-sm hover:shadow ${
                        isSubmitting
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-[#C0152F] hover:bg-[#A01327] active:bg-[#8B1122]'
                      }`}
                      aria-busy={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Send Message
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-semibold text-[#134252] mb-6">
              Frequently Asked Questions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-[#134252] mb-2">
                  How quickly will I receive a response?
                </h3>
                <p className="text-sm text-[#626C71]">
                  We typically respond to all inquiries within 24-48 hours during business days. Urgent matters may receive faster attention.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#134252] mb-2">
                  Can I report a found item through this form?
                </h3>
                <p className="text-sm text-[#626C71]">
                  For reporting found or lost items, please use the dedicated "Report Item" feature on our platform for faster processing.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#134252] mb-2">
                  What if I need immediate assistance?
                </h3>
                <p className="text-sm text-[#626C71]">
                  For urgent matters, please call our support line at +1 (234) 567-8900 during office hours.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#134252] mb-2">
                  Is my information secure?
                </h3>
                <p className="text-sm text-[#626C71]">
                  Yes, all information submitted through this form is encrypted and handled according to our privacy policy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default ContactUs;
