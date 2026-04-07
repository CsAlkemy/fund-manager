import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter | null;
  private from: string;

  constructor() {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    this.from = process.env.EMAIL_FROM || user || 'noreply@fund-manager.app';

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
      });
      console.log(`[Email] Gmail SMTP configured for ${user}`);
    } else {
      this.transporter = null;
      console.log('[Email] No SMTP credentials — codes will print to console');
    }
  }

  async sendPasswordResetCode(email: string, code: string): Promise<void> {
    const subject = 'Your password reset code';
    const html = `<p>Your password reset code is: <strong>${code}</strong></p><p>This code expires in 15 minutes.</p>`;

    if (!this.transporter) {
      console.log(`[DEV] Password reset code for ${email}: ${code}`);
      return;
    }

    await this.transporter.sendMail({ from: this.from, to: email, subject, html });
    console.log(`[Email] Reset code sent to ${email}`);
  }
}
