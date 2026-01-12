const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Resume = require("../models/Resume");
const { OpenAI } = require("openai");
const PDFDocument = require("pdfkit");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper: Format dates safely for PDF
const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString();
};

// Get all resumes
router.get("/", auth, async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user.userId });
    res.json(resumes);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching resumes", error: error.message });
  }
});

// Get single resume
router.get("/:id", auth, async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      user: req.user.userId,
    });
    if (!resume) return res.status(404).json({ message: "Resume not found" });
    res.json(resume);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching resume", error: error.message });
  }
});

// Create resume
router.post("/", auth, async (req, res) => {
  try {
    const resume = new Resume({ ...req.body, user: req.user.userId });
    await resume.save();
    res.status(201).json(resume);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating resume", error: error.message });
  }
});

// Update resume
router.put("/:id", auth, async (req, res) => {
  try {
    const resume = await Resume.findOneAndUpdate(
      { _id: req.params.id, user: req.user.userId },
      req.body,
      { new: true }
    );
    if (!resume) return res.status(404).json({ message: "Resume not found" });
    res.json(resume);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating resume", error: error.message });
  }
});

// Delete resume
router.delete("/:id", auth, async (req, res) => {
  try {
    const resume = await Resume.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId,
    });
    if (!resume) return res.status(404).json({ message: "Resume not found" });
    res.json({ message: "Resume deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting resume", error: error.message });
  }
});

// AI Bullet Points
router.post("/generate-bullets", auth, async (req, res) => {
  try {
    const { experience, position, company } = req.body;
    if (!experience)
      return res
        .status(400)
        .json({ message: "Experience description is required" });

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a professional resume writer. Output valid JSON array of strings only.",
        },
        {
          role: "user",
          content: `Create 3-5 resume bullet points for ${position} at ${company} based on: ${experience}. Return JSON array.`,
        },
      ],
      temperature: 0.7,
    });

    const content = completion.choices[0].message.content;
    let bulletPoints;
    try {
      const cleanJson = content
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      bulletPoints = JSON.parse(cleanJson);
    } catch (e) {
      bulletPoints = content
        .split("\n")
        .map((l) => l.replace(/^[-•*]\s*/, "").trim())
        .filter((l) => l);
    }

    res.json({ bulletPoints });
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ message: "Error generating bullet points" });
  }
});

// Server-Side PDF Generation
router.get("/:id/pdf", auth, async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      user: req.user.userId,
    });
    if (!resume) return res.status(404).json({ message: "Resume not found" });

    const doc = new PDFDocument();
    const filename = (resume.title || "resume").replace(/[^a-z0-9]/gi, "_");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${filename}.pdf`
    );

    doc.pipe(res);

    doc
      .fontSize(25)
      .text(resume.personalInfo?.fullName || "", { align: "center" });
    doc.moveDown();

    if (resume.personalInfo) {
      const contact = [
        resume.personalInfo.email,
        resume.personalInfo.phone,
        resume.personalInfo.location,
      ]
        .filter(Boolean)
        .join(" | ");
      doc.fontSize(12).text(contact, { align: "center" });
      doc.moveDown();
    }

    if (resume.summary) {
      doc.fontSize(16).text("Summary");
      doc.fontSize(12).text(resume.summary);
      doc.moveDown();
    }

    if (resume.workExperience?.length) {
      doc.fontSize(16).text("Experience");
      resume.workExperience.forEach((exp) => {
        doc.fontSize(14).text(`${exp.position} at ${exp.company}`);
        doc
          .fontSize(12)
          .text(
            `${formatDate(exp.startDate)} - ${
              exp.current ? "Present" : formatDate(exp.endDate)
            }`
          );
        if (exp.bulletPoints?.length) {
          exp.bulletPoints.forEach((p) => doc.text(`• ${p}`));
        }
        doc.moveDown();
      });
    }

    if (resume.education?.length) {
      doc.fontSize(16).text("Education");
      resume.education.forEach((edu) => {
        doc.fontSize(14).text(`${edu.degree} in ${edu.field}`);
        doc.fontSize(12).text(edu.institution);
        doc
          .fontSize(12)
          .text(
            `${formatDate(edu.startDate)} - ${
              edu.current ? "Present" : formatDate(edu.endDate)
            }`
          );
        doc.moveDown();
      });
    }

    if (resume.skills?.length) {
      doc.fontSize(16).text("Skills");
      doc.fontSize(12).text(resume.skills.join(", "));
    }

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error generating PDF" });
  }
});

module.exports = router;
