import path from "path";
import fs from "fs";
import handlebars from "handlebars";
import { transporter } from "../helpers/nodemailer";

export async function sendMail(
  to: string,
  subject: string,
  templateName: string,
  data: any
) {
  const templatePath = path.join(__dirname, `../templates/${templateName}.hbs`);
  const templateSource = fs.readFileSync(templatePath, "utf-8");
  const compiledTemplate = handlebars.compile(templateSource);

  const html = compiledTemplate(data);

  await transporter.sendMail({
    to,
    subject,
    html,
  });
}
