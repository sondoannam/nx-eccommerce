import { Injectable, Logger } from '@nestjs/common';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { OTPTemplate } from '../interfaces';
import {
  otpLoginTemplateValues,
  otpForgotPasswordTemplateValues,
  otpTwoFactorTemplateValues,
} from '../templates/template-values';
import { OtpType, Language } from '../dtos';

@Injectable()
export class EmailTemplateService {
  private readonly logger = new Logger(EmailTemplateService.name);
  private readonly templatesPath = path.join(__dirname, '../templates');
  private templateCache = new Map<string, HandlebarsTemplateDelegate>();

  /**
   * Get compiled Handlebars template (with caching)
   */
  private getCompiledTemplate(
    templateName: string
  ): HandlebarsTemplateDelegate {
    if (this.templateCache.has(templateName)) {
      const template = this.templateCache.get(templateName);
      if (template) return template;
    }

    try {
      const templatePath = path.join(this.templatesPath, `${templateName}.hbs`);
      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      const compiledTemplate = handlebars.compile(templateContent);

      this.templateCache.set(templateName, compiledTemplate);
      return compiledTemplate;
    } catch (error) {
      this.logger.error(`Failed to load template ${templateName}:`, error);
      throw new Error(`Template ${templateName} not found`);
    }
  }

  /**
   * Get template values based on OTP type and language
   */
  private getTemplateValues(
    otpType: OtpType,
    language: Language,
    otpCode: string
  ): OTPTemplate {
    let templateValues: OTPTemplate;

    switch (otpType) {
      case OtpType.EMAIL_VERIFICATION:
        templateValues = { ...otpLoginTemplateValues[language] };
        break;
      case OtpType.PASSWORD_RESET:
        templateValues = { ...otpForgotPasswordTemplateValues[language] };
        break;
      case OtpType.TWO_FACTOR_AUTH:
        templateValues = {
          title:
            language === Language.VI
              ? 'Xác thực hai bước'
              : 'Two-Factor Authentication',
          contentTitle:
            language === Language.VI ? 'Mã xác thực' : 'Verification Code',
          description:
            language === Language.VI
              ? 'Vui lòng sử dụng mã xác thực bên dưới để hoàn tất đăng nhập:'
              : 'Please use the verification code below to complete your login:',
          code: otpCode,
          note:
            language === Language.VI
              ? 'Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.'
              : "If you didn't request this, you can ignore this email.",
        };
        break;
      default:
        templateValues = { ...otpLoginTemplateValues[language] };
    }

    // Set the actual OTP code
    templateValues.code = otpCode;
    return templateValues;
  }

  /**
   * Generate HTML email content from template
   */
  generateEmailHtml(
    otpType: OtpType,
    language: Language,
    otpCode: string,
    templateName = 'otp.template'
  ): string {
    try {
      const compiledTemplate = this.getCompiledTemplate(templateName);
      const templateValues = this.getTemplateValues(otpType, language, otpCode);

      const html = compiledTemplate(templateValues);

      this.logger.debug(`Generated ${otpType} email template in ${language}`);
      return html;
    } catch (error) {
      this.logger.error(`Failed to generate email template:`, error);
      throw error;
    }
  }

  /**
   * Generate OTP email content (interface for processors)
   */
  async generateOtpEmail(params: {
    recipientName: string;
    otpCode: string;
    otpType: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' | 'TWO_FACTOR_AUTH';
    language?: 'en' | 'vi';
    expiresInMinutes?: number;
  }): Promise<string> {
    const otpType = params.otpType as OtpType;
    const language = (
      params.language === 'vi' ? Language.VI : Language.EN
    ) as Language;

    try {
      // Choose template based on OTP type
      let templateName: string;
      let templateValues: OTPTemplate;

      switch (otpType) {
        case OtpType.PASSWORD_RESET:
          templateName = 'password-reset.template';
          templateValues = { ...otpForgotPasswordTemplateValues[language] };
          break;
        case OtpType.TWO_FACTOR_AUTH:
          templateName = 'two-factor.template';
          templateValues = { ...otpTwoFactorTemplateValues[language] };
          break;
        case OtpType.EMAIL_VERIFICATION:
        default:
          templateName = 'otp.template';
          templateValues = { ...otpLoginTemplateValues[language] };
      }

      const compiledTemplate = this.getCompiledTemplate(templateName);

      // Set values and enriched data
      templateValues.code = params.otpCode;
      templateValues.recipientName = params.recipientName;
      templateValues.expiresInMinutes = params.expiresInMinutes || 10;
      templateValues.currentYear = new Date().getFullYear();

      const html = compiledTemplate(templateValues);

      this.logger.debug(
        `Generated ${otpType} email for ${params.recipientName} using template ${templateName}`
      );
      return html;
    } catch (error) {
      this.logger.error(`Failed to generate OTP email:`, error);
      throw error;
    }
  }

  /**
   * Get email subject based on OTP type and language
   */
  getEmailSubject(otpType: OtpType, language: Language): string {
    const subjects = {
      [OtpType.EMAIL_VERIFICATION]: {
        [Language.EN]: 'Verify Your Email Address',
        [Language.VI]: 'Xác Thực Địa Chỉ Email',
      },
      [OtpType.PASSWORD_RESET]: {
        [Language.EN]: 'Reset Your Password',
        [Language.VI]: 'Đặt Lại Mật Khẩu',
      },
      [OtpType.TWO_FACTOR_AUTH]: {
        [Language.EN]: 'Two-Factor Authentication Code',
        [Language.VI]: 'Mã Xác Thực Hai Bước',
      },
      [OtpType.PHONE_VERIFICATION]: {
        [Language.EN]: 'Phone Verification Code',
        [Language.VI]: 'Mã Xác Thực Số Điện Thoại',
      },
    };

    return (
      subjects[otpType]?.[language] ||
      subjects[OtpType.EMAIL_VERIFICATION][Language.EN]
    );
  }

  /**
   * Clear template cache (useful for development)
   */
  clearTemplateCache(): void {
    this.templateCache.clear();
    this.logger.log('Template cache cleared');
  }
}
