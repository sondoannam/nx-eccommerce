import { OTPTemplate } from '../interfaces';

/**
 * Current year for copyright notices
 */
const currentYear = new Date().getFullYear();

/**
 * Email verification OTP template values
 */
export const otpLoginTemplateValues: {
  en: OTPTemplate;
  vi: OTPTemplate;
} = {
  en: {
    title: 'Verify your registration',
    contentTitle: 'Verification code',
    description:
      'Please use the verification code below to complete your registration:',
    code: '', // This will be filled dynamically
    note: "If you didn't request this, you can ignore this email.",
    securityNote:
      "For security reasons, please don't share this code with anyone.",
    currentYear,
  },
  vi: {
    title: 'Xác thực đăng ký',
    contentTitle: 'Mã xác thực',
    description:
      'Vui lòng sử dụng mã xác thực bên dưới để hoàn tất phiên đăng ký:',
    code: '', // This will be filled dynamically
    note: 'Nếu quý khách không yêu cầu mã này, hãy bỏ qua email này.',
    securityNote:
      'Vì lý do bảo mật, vui lòng không chia sẻ mã này với bất kỳ ai.',
    currentYear,
  },
};

/**
 * Password reset OTP template values
 */
export const otpForgotPasswordTemplateValues: {
  en: OTPTemplate;
  vi: OTPTemplate;
} = {
  en: {
    title: 'Reset Your Password',
    contentTitle: 'Password Reset Code',
    description:
      'You have requested to reset your password. Please use this verification code:',
    code: '', // Will be filled dynamically
    note: "If you didn't request a password reset, please ignore this email or contact support immediately.",
    securityNote:
      'Never share your password reset code with anyone, including Multi-Vendor SaaS support team.',
    currentYear,
  },
  vi: {
    title: 'Đặt Lại Mật Khẩu',
    contentTitle: 'Mã Đặt Lại Mật Khẩu',
    description:
      'Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng sử dụng mã xác thực này:',
    code: '', // Will be filled dynamically
    note: 'Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này hoặc liên hệ ngay với bộ phận hỗ trợ.',
    securityNote:
      'Không bao giờ chia sẻ mã đặt lại mật khẩu của bạn với bất kỳ ai, kể cả nhóm hỗ trợ của Multi-Vendor SaaS.',
    currentYear,
  },
};

/**
 * Two-factor authentication OTP template values
 */
export const otpTwoFactorTemplateValues: {
  en: OTPTemplate;
  vi: OTPTemplate;
} = {
  en: {
    title: 'Two-Factor Authentication Code',
    contentTitle: 'Login Security Code',
    description:
      'To complete your login, please enter the following verification code:',
    code: '', // Will be filled dynamically
    note: "If you didn't attempt to log in, please secure your account by changing your password immediately.",
    securityNote:
      'This code is only valid for a single login attempt. Multi-Vendor SaaS will never ask for this code via email, chat or phone.',
    currentYear,
  },
  vi: {
    title: 'Mã Xác Thực Hai Bước',
    contentTitle: 'Mã Bảo Mật Đăng Nhập',
    description: 'Để hoàn tất đăng nhập, vui lòng nhập mã xác thực sau:',
    code: '', // Will be filled dynamically
    note: 'Nếu bạn không cố gắng đăng nhập, vui lòng bảo vệ tài khoản của bạn bằng cách thay đổi mật khẩu ngay lập tức.',
    securityNote:
      'Mã này chỉ có hiệu lực cho một lần đăng nhập duy nhất. Multi-Vendor SaaS sẽ không bao giờ yêu cầu mã này qua email, chat hoặc điện thoại.',
    currentYear,
  },
};
