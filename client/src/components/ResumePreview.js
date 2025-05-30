import React from 'react';

const templates = {
  modern: {
    name: 'Modern',
    className: 'bg-white shadow-lg rounded-lg p-8 max-w-[800px] mx-auto'
  },
  classic: {
    name: 'Classic',
    className: 'bg-white border-2 border-gray-200 p-8 max-w-[800px] mx-auto'
  },
  minimal: {
    name: 'Minimal',
    className: 'bg-gray-50 p-8 max-w-[800px] mx-auto'
  }
};

const ResumePreview = ({ data, selectedTemplate }) => {
  const template = templates[selectedTemplate] || templates.modern;

  const renderHeader = () => (
    <div className="text-center mb-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{data.personalInfo.fullName}</h1>
      <div className="text-gray-600 text-sm">
        {data.personalInfo.email} | {data.personalInfo.phone} | {data.personalInfo.location}
        {data.personalInfo.linkedin && <div>LinkedIn: {data.personalInfo.linkedin}</div>}
        {data.personalInfo.website && <div>Website: {data.personalInfo.website}</div>}
      </div>
    </div>
  );

  const renderSummary = () => (
    data.summary && (
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Professional Summary</h2>
        <p className="text-gray-700">{data.summary}</p>
      </div>
    )
  );

  const renderExperience = () => (
    data.workExperience.length > 0 && (
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Work Experience</h2>
        {data.workExperience.map((exp, index) => (
          <div key={index} className="mb-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-gray-900">{exp.position}</h3>
                <p className="text-gray-600">{exp.company}</p>
              </div>
              <p className="text-gray-600 text-sm">
                {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
              </p>
            </div>
            {exp.bulletPoints.length > 0 && (
              <ul className="list-disc list-inside mt-2 text-gray-700">
                {exp.bulletPoints.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    )
  );

  const renderEducation = () => (
    data.education.length > 0 && (
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Education</h2>
        {data.education.map((edu, index) => (
          <div key={index} className="mb-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-gray-900">{edu.degree}</h3>
                <p className="text-gray-600">{edu.institution}</p>
                {edu.field && <p className="text-gray-600">{edu.field}</p>}
                {edu.gpa && <p className="text-gray-600">GPA: {edu.gpa}</p>}
              </div>
              <p className="text-gray-600 text-sm">
                {edu.startDate} - {edu.current ? 'Present' : edu.endDate}
              </p>
            </div>
          </div>
        ))}
      </div>
    )
  );

  const renderSkills = () => (
    data.skills.length > 0 && (
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Skills</h2>
        <p className="text-gray-700">{data.skills.join(', ')}</p>
      </div>
    )
  );

  return (
    <div className={template.className}>
      {renderHeader()}
      {renderSummary()}
      {renderExperience()}
      {renderEducation()}
      {renderSkills()}
    </div>
  );
};

export default ResumePreview; 