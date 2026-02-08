import path from "path";
import fs from "fs";
import handlebars from "handlebars";
import { transporter } from "./nodemailer";
import { GMAIL_EMAIL } from "../configs/env.configs";

type TemplateName =
  | "registration"
  | "reset-password"
  | "update-email";

export async function sendMailWithTemplate(
  to: string,
  subject: string,
  template: TemplateName,
  context: Record<string, any>
) {
  const templatePath = path.join(
    __dirname,
    "../templates",
    `${template}.hbs`
  );

  const source = fs.readFileSync(templatePath, "utf-8");
  const compiled = handlebars.compile(source);
  const html = compiled(context);

  await transporter.sendMail({
    from: `"No Reply" <${GMAIL_EMAIL}>`,
    to,
    subject,
    html,
  });
}
