const express = require('express');
const nodemailer = require('nodemailer');

const router = express.Router();

const SUBJECT_MAP = {
  hiring: 'Cơ hội Thực tập Fullstack Developer',
  collaboration: 'Trao đổi dự án phần mềm',
  general: 'Thảo luận kỹ thuật'
};

// POST /api/contact
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body || {};

    // 1. Kiểm tra đầu vào (Validation)
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Vui lòng nhập họ và tên!' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Vui lòng nhập email liên hệ!' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'Địa chỉ email không hợp lệ!' });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Vui lòng nhập nội dung tin nhắn!' });
    }

    const subjectLabel = SUBJECT_MAP[subject] || subject || 'Liên hệ từ Portfolio';
    const targetEmail = process.env.TO_EMAIL || 'hoangvu2004dl@gmail.com';
    const smtpUser = process.env.SMTP_USER || 'hoangvu2004dl@gmail.com';
    const smtpPass = process.env.SMTP_PASS;

    // 2. Kiểm tra cấu hình SMTP Pass
    if (!smtpPass || smtpPass === 'your_google_app_password_here') {
      console.warn('[Contact API] SMTP_PASS chưa được cấu hình Mật khẩu ứng dụng Google trong .env');
      return res.status(500).json({
        error: 'Chức năng gửi mail chưa được cấu hình Mật khẩu ứng dụng Google (SMTP_PASS) trong file .env!'
      });
    }

    // 3. Khởi tạo Nodemailer Transporter với Google SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true', // true đối với port 465, false đối với port 587
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    const mailOptions = {
      from: `"${name.trim()}" <${smtpUser}>`,
      replyTo: email.trim(),
      to: targetEmail,
      subject: `[Portfolio Contact] ${subjectLabel} - Từ: ${name.trim()}`,
      text: `Họ tên: ${name.trim()}\nEmail: ${email.trim()}\nMục đích: ${subjectLabel}\n\nNội dung:\n${message.trim()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #0ea5e9; padding: 16px 24px; color: #ffffff;">
            <h2 style="margin: 0; font-size: 20px;">Lời nhắn mới từ Website Portfolio</h2>
          </div>
          <div style="padding: 24px; color: #1e293b; background-color: #ffffff;">
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; width: 120px; color: #64748b;">Họ và tên:</td>
                <td style="padding: 8px 0;">${name.trim()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #64748b;">Email:</td>
                <td style="padding: 8px 0;"><a href="mailto:${email.trim()}" style="color: #0ea5e9; text-decoration: none;">${email.trim()}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #64748b;">Mục đích:</td>
                <td style="padding: 8px 0;"><span style="background: #e0f2fe; color: #0369a1; padding: 3px 8px; border-radius: 4px; font-size: 13px;">${subjectLabel}</span></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #64748b;">Thời gian:</td>
                <td style="padding: 8px 0; color: #64748b; font-size: 13px;">${new Date().toLocaleString('vi-VN')}</td>
              </tr>
            </table>
            <div style="border-top: 1px solid #f1f5f9; margin-top: 16px; padding-top: 16px;">
              <h4 style="margin: 0 0 8px 0; color: #334155;">Nội dung tin nhắn:</h4>
              <div style="background: #f8fafc; padding: 16px; border-radius: 6px; border-left: 4px solid #0ea5e9; white-space: pre-wrap; font-size: 14px; line-height: 1.6;">${message.trim()}</div>
            </div>
          </div>
          <div style="background: #f1f5f9; padding: 12px 24px; font-size: 12px; color: #94a3b8; text-align: center;">
            Email được gửi tự động từ Portfolio Website của Lô Hoàng Vũ.
          </div>
        </div>
      `
    };

    // 4. Gửi email
    const info = await transporter.sendMail(mailOptions);
    console.log('[Contact API] Email đã được gửi thành công. Message ID:', info.messageId);

    return res.json({
      success: true,
      message: 'Lời nhắn của bạn đã được gửi trực tiếp đến hoangvu2004dl@gmail.com thành công!'
    });
  } catch (error) {
    console.error('[Contact API Error]:', error);
    return res.status(500).json({
      error: `Không thể gửi email: ${error.message || 'Lỗi kết nối tới SMTP Server'}`
    });
  }
});

module.exports = router;
