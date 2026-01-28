const SERVICE_ID = 'service_phtixb3';
const TEMPLATE_ID = 'template_lf3a3zc';
const PUBLIC_KEY = '3rpu8Ifcpzvt_M2PA';

export const sendEmailVerification = async (toEmail, toName, code) => {
    if (!SERVICE_ID || SERVICE_ID === 'YOUR_SERVICE_ID') {
        console.warn('EmailJS IDs are not set.');
        return false;
    }

    try {
        const data = {
            service_id: SERVICE_ID,
            template_id: TEMPLATE_ID,
            user_id: PUBLIC_KEY,
            template_params: {
                to_email: String(toEmail),
                to_name: String(toName || 'User'),
                passcode: String(code),
                time: String(new Date(Date.now() + 15 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
            },
        };

        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            return true;
        } else {
            const errorData = await response.text();
            console.error('EmailJS Error:', errorData);
            return false;
        }
    } catch (error) {
        console.error('EmailJS Network Error:', error);
        return false;
    }
};
