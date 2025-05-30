import html2pdf from 'html2pdf.js';

export const exportToPDF = async (resumeData) => {
  // Create a temporary container for the PDF content
  const container = document.createElement('div');
  container.className = 'pdf-container';
  
  // Generate the HTML content
  container.innerHTML = `
    <div class="resume-pdf" style="font-family: 'Arial', sans-serif; max-width: 800px; margin: 0 auto; padding: 40px;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 24px; color: #2d3748; margin-bottom: 10px;">${resumeData.personalInfo.fullName}</h1>
        <div style="color: #4a5568; font-size: 14px;">
          ${resumeData.personalInfo.email} | ${resumeData.personalInfo.phone} | ${resumeData.personalInfo.location}
          ${resumeData.personalInfo.linkedin ? `<br>LinkedIn: ${resumeData.personalInfo.linkedin}` : ''}
          ${resumeData.personalInfo.website ? `<br>Website: ${resumeData.personalInfo.website}` : ''}
        </div>
      </div>

      <!-- Summary -->
      ${resumeData.summary ? `
        <div style="margin-bottom: 25px;">
          <h2 style="font-size: 18px; color: #2d3748; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 10px;">Professional Summary</h2>
          <p style="color: #4a5568; font-size: 14px; line-height: 1.5;">${resumeData.summary}</p>
        </div>
      ` : ''}

      <!-- Work Experience -->
      ${resumeData.workExperience.length > 0 ? `
        <div style="margin-bottom: 25px;">
          <h2 style="font-size: 18px; color: #2d3748; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 10px;">Work Experience</h2>
          ${resumeData.workExperience.map(exp => `
            <div style="margin-bottom: 15px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <h3 style="font-size: 16px; color: #2d3748; margin: 0;">${exp.position}</h3>
                <span style="color: #4a5568; font-size: 14px;">${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}</span>
              </div>
              <h4 style="font-size: 14px; color: #4a5568; margin: 0 0 10px 0;">${exp.company}</h4>
              ${exp.bulletPoints.length > 0 ? `
                <ul style="margin: 0; padding-left: 20px; color: #4a5568; font-size: 14px; line-height: 1.5;">
                  ${exp.bulletPoints.map(point => `<li>${point}</li>`).join('')}
                </ul>
              ` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}

      <!-- Education -->
      ${resumeData.education.length > 0 ? `
        <div style="margin-bottom: 25px;">
          <h2 style="font-size: 18px; color: #2d3748; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 10px;">Education</h2>
          ${resumeData.education.map(edu => `
            <div style="margin-bottom: 15px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <h3 style="font-size: 16px; color: #2d3748; margin: 0;">${edu.degree}${edu.field ? ` in ${edu.field}` : ''}</h3>
                <span style="color: #4a5568; font-size: 14px;">${edu.startDate} - ${edu.current ? 'Present' : edu.endDate}</span>
              </div>
              <h4 style="font-size: 14px; color: #4a5568; margin: 0;">${edu.institution}${edu.gpa ? ` | GPA: ${edu.gpa}` : ''}</h4>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <!-- Skills -->
      ${resumeData.skills.length > 0 ? `
        <div style="margin-bottom: 25px;">
          <h2 style="font-size: 18px; color: #2d3748; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 10px;">Skills</h2>
          <p style="color: #4a5568; font-size: 14px; line-height: 1.5;">${resumeData.skills.join(', ')}</p>
        </div>
      ` : ''}
    </div>
  `;

  // Configure PDF options
  const options = {
    margin: 10,
    filename: `${resumeData.title || 'resume'}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  // Generate and download PDF
  try {
    await html2pdf().set(options).from(container).save();
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
}; 