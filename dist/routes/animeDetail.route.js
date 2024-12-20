"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const puppeteer_1 = __importDefault(require("puppeteer"));
const router = (0, express_1.Router)();
router.get("/:slug", async (req, res) => {
    try {
        const { slug } = req.params;
        const url = `${process.env.ENDPOINT_ANIME}/anime/${slug}`;
        const browser = await puppeteer_1.default.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: "networkidle2" });
        await page.waitForSelector("article");
        const title = await page.$eval(".entry-title", (el) => el.textContent);
        const fullTitle = await page.$eval(".alter", (el) => el.textContent);
        const status = await page.$eval(".spe span", (element) => {
            if (element.querySelector("b")?.textContent === "Status:") {
                return element.textContent?.replace("Status:", "").trim();
            }
            return "";
        });
        const studio = await page.$eval(".spe span a", (element) => element.textContent?.trim());
        const released = await page.$eval(".spe .split", (element) => {
            if (element.querySelector("b")?.textContent === "Released:") {
                return element.textContent?.replace("Released:", "").trim();
            }
            return "";
        });
        const season = await page.$eval(".spe span:nth-child(4) a", (element) => element.textContent?.trim());
        const type = await page.$eval(".spe span:nth-child(5)", (element) => {
            return element.textContent?.replace("Type:", "").trim();
        });
        const episodes = await page.$eval(".spe span:nth-child(6)", (element) => {
            return element.textContent?.replace("Episodes:", "").trim();
        });
        const updateOn = await page.$eval(".spe time[itemprop='datePublished']", (element) => {
            return element.getAttribute("datetime");
        });
        const releasedOn = await page.$eval(".spe time[itemprop='dateModified']", (element) => {
            return element.getAttribute("datetime");
        });
        const genres = await page.$$eval(".genxed a[rel='tag']", (elements) => {
            return elements.map((element) => element.textContent?.trim());
        });
        const rating = await page.$eval(".rating strong", (el) => {
            const text = el.textContent?.trim() || "";
            const match = text.match(/[\d.]+/); // Mencari angka (termasuk desimal)
            return match ? match[0] : null;
        });
        const synopsis = await page.$eval(".entry-content", (el) => el.textContent?.trim());
        const epList = await page.$$eval(".eplister ul li", (el) => {
            return el.map((eps) => {
                const epTitle = eps.querySelector(".epl-title")?.textContent;
                const epLang = eps.querySelector(".epl-sub")?.textContent;
                const epRelease = eps.querySelector(".epl-date")?.textContent;
                const epSlug = epTitle
                    ?.toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-+|-+$/g, "");
                return { epTitle, epLang, epRelease, epSlug };
            });
        });
        res.json({
            success: true,
            data: {
                title,
                fullTitle,
                status,
                studio,
                released,
                season,
                type,
                episodes,
                updateOn,
                releasedOn,
                genres,
                rating,
                synopsis,
                epList,
            },
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Error while scraping data",
        });
    }
});
exports.default = router;
