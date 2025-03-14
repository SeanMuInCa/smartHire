import { encode } from "gpt-tokenizer";
import { ResumeBasics } from "./types";

const EMAIL_REGEX = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
const PHONE_REGEX = /(?:\+?(\d{1,3})[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})(?: *x(\d+))?)|(?:(\d{3})-(\d{3})-(\d{4}))/g;
const URL_REGEX = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+)(?:\/[^\s]*)?/gi;

export const extractBasics = (text: string): ResumeBasics => {
  const lines = text.split("\n");
  const firstLine = lines[0].trim();

  // 提取姓名（通常是第一行）
  const name = firstLine.length <= 30 ? firstLine : "";

  // 提取邮箱
  const emailMatches = text.match(EMAIL_REGEX);
  const email = emailMatches ? emailMatches[0] : "";

  // 提取电话
  const phoneMatches = text.match(PHONE_REGEX);
  const phone = phoneMatches ? phoneMatches[0] : "";

  // 提取URL
  const urlMatches = text.match(URL_REGEX);
  const url = urlMatches ? urlMatches[0] : "";

  // 提取摘要（通常在开头的几行）
  const firstFewLines = lines.slice(0, 5).join(" ");
  const tokens = encode(firstFewLines);
  const summary = tokens.length > 50 ? firstFewLines : "";

  return {
    name,
    email,
    phone,
    url,
    summary,
    location: {
      address: "",
      postalCode: "",
      city: "",
      countryCode: "",
      region: "",
    },
  };
};
