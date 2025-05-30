const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Resume = require('../models/Resume');
const { OpenAI } = require('openai');
const PDFDocument = require('pdfkit');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Get all resumes for a user
router.get('/', auth, async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user.userId });
    res.json(resumes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching resumes', error: error.message });
  }
});

// Get a single resume
router.get('/:id', auth, async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      user: req.user.userId
    });
    
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }
    
    res.json(resume);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching resume', error: error.message });
  }
});

// Create a new resume
router.post('/', auth, async (req, res) => {
  try {
    const resume = new Resume({
      ...req.body,
      user: req.user.userId
    });
    
    await resume.save();
    res.status(201).json(resume);
  } catch (error) {
    res.status(500).json({ message: 'Error creating resume', error: error.message });
  }
});

// Update a resume
router.put('/:id', auth, async (req, res) => {
  try {
    const resume = await Resume.findOneAndUpdate(
      { _id: req.params.id, user: req.user.userId },
      req.body,
      { new: true }
    );
    
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }
    
    res.json(resume);
  } catch (error) {
    res.status(500).json({ message: 'Error updating resume', error: error.message });
  }
});

// Delete a resume
router.delete('/:id', auth, async (req, res) => {
  try {
    const resume = await Resume.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId
    });
    
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }
    
    res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting resume', error: error.message });
  }
});

// Generate bullet points using OpenAI
router.post('/generate-bullets', auth, async (req, res) => {
  try {
    const { experience, position, company } = req.body;

    if (!experience) {
      return res.status(400).json({ message: 'Experience description is required' });
    }

    const prompt = `As a professional resume writer, create 3-5 impactful bullet points for a resume based on the following job experience:

Position: ${position}
Company: ${company}
Experience Description: ${experience}

Requirements:
1. Each bullet point should start with a strong action verb
2. Focus on quantifiable achievements and specific results
3. Highlight skills and impact
4. Use professional and concise language
5. Format as a JSON array of strings

Example format:
["Led a team of 5 developers to deliver a new feature that increased user engagement by 25%", "Implemented automated testing that reduced bug reports by 40%"]`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a professional resume writer who creates impactful, achievement-focused bullet points."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    // Extract and parse the bullet points from the response
    const response = completion.choices[0].message.content;
    let bulletPoints;
    
    try {
      // Try to parse the response as JSON
      bulletPoints = JSON.parse(response);
    } catch (error) {
      // If parsing fails, split the response into lines and clean up
      bulletPoints = response
        .split('\n')
        .map(line => line.replace(/^[•\-\*]\s*/, '').trim())
        .filter(line => line.length > 0);
    }

    res.json({ bulletPoints });
  } catch (error) {
    console.error('Error generating bullet points:', error);
    res.status(500).json({ message: 'Error generating bullet points', error: error.message });
  }
});

// Generate PDF
router.get('/:id/pdf', auth, async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      user: req.user.userId
    });
    
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${resume.title}.pdf`);
    
    doc.pipe(res);

    // Add content to PDF
    doc.fontSize(25).text(resume.personalInfo.fullName, { align: 'center' });
    doc.moveDown();
    
    // Add contact information
    doc.fontSize(12).text(`${resume.personalInfo.email} | ${resume.personalInfo.phone} | ${resume.personalInfo.location}`);
    doc.moveDown();

    // Add summary
    if (resume.summary) {
      doc.fontSize(16).text('Summary');
      doc.fontSize(12).text(resume.summary);
      doc.moveDown();
    }

    // Add work experience
    if (resume.workExperience.length > 0) {
      doc.fontSize(16).text('Work Experience');
      resume.workExperience.forEach(exp => {
        doc.fontSize(14).text(`${exp.position} at ${exp.company}`);
        doc.fontSize(12).text(`${exp.startDate.toLocaleDateString()} - ${exp.current ? 'Present' : exp.endDate.toLocaleDateString()}`);
        exp.bulletPoints.forEach(point => {
          doc.fontSize(12).text(`• ${point}`);
        });
        doc.moveDown();
      });
    }

    // Add education
    if (resume.education.length > 0) {
      doc.fontSize(16).text('Education');
      resume.education.forEach(edu => {
        doc.fontSize(14).text(`${edu.degree} in ${edu.field}`);
        doc.fontSize(12).text(`${edu.institution}`);
        doc.fontSize(12).text(`${edu.startDate.toLocaleDateString()} - ${edu.current ? 'Present' : edu.endDate.toLocaleDateString()}`);
        if (edu.gpa) {
          doc.fontSize(12).text(`GPA: ${edu.gpa}`);
        }
        doc.moveDown();
      });
    }

    // Add skills
    if (resume.skills.length > 0) {
      doc.fontSize(16).text('Skills');
      doc.fontSize(12).text(resume.skills.join(', '));
    }

    doc.end();
  } catch (error) {
    res.status(500).json({ message: 'Error generating PDF', error: error.message });
  }
});

module.exports = router; 