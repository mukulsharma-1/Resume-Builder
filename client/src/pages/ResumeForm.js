import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api";
import { toast } from "react-toastify";
import { exportToPDF } from "../utils/pdfExport";
import ResumePreview from "../components/ResumePreview";

const ResumeForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [generatingBullets, setGeneratingBullets] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    title: "",
    personalInfo: {
      fullName: "",
      email: "",
      phone: "",
      location: "",
      linkedin: "",
      website: "",
    },
    summary: "",
    workExperience: [],
    education: [],
    skills: [],
  });
  const [selectedTemplate, setSelectedTemplate] = useState("modern");

  const fetchResume = useCallback(async () => {
    try {
      const response = await api.get(`/resume/${id}`);

      // FIX: Format dates safely for input fields (YYYY-MM-DD)
      const data = response.data;
      if (data.workExperience) {
        data.workExperience = data.workExperience.map((exp) => ({
          ...exp,
          startDate: exp.startDate ? exp.startDate.split("T")[0] : "",
          endDate: exp.endDate ? exp.endDate.split("T")[0] : "",
        }));
      }
      if (data.education) {
        data.education = data.education.map((edu) => ({
          ...edu,
          startDate: edu.startDate ? edu.startDate.split("T")[0] : "",
          endDate: edu.endDate ? edu.endDate.split("T")[0] : "",
        }));
      }

      setFormData(data);
    } catch (error) {
      toast.error("Error fetching resume");
      navigate("/dashboard");
    }
  }, [id, navigate]);

  useEffect(() => {
    if (id) {
      fetchResume();
    }
  }, [id, fetchResume]);

  const validateField = (name, value) => {
    switch (name) {
      case "personalInfo.email":
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
          ? ""
          : "Invalid email address";
      case "personalInfo.phone":
        return /^\+?[\d\s-]{10,}$/.test(value) ? "" : "Invalid phone number";
      case "personalInfo.website":
        return value
          ? /^https?:\/\/.+/.test(value)
            ? ""
            : "Invalid website URL"
          : "";
      case "personalInfo.linkedin":
        return value
          ? /^https?:\/\/(www\.)?linkedin\.com\/.+/.test(value)
            ? ""
            : "Invalid LinkedIn URL"
          : "";
      default:
        return "";
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);

    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));

    if (name.includes(".")) {
      const [section, field] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleArrayInputChange = (section, index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: prev[section].map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addArrayItem = (section) => {
    const newItem =
      section === "workExperience"
        ? {
            company: "",
            position: "",
            startDate: "",
            endDate: "",
            current: false,
            description: "",
            bulletPoints: [],
          }
        : {
            institution: "",
            degree: "",
            field: "",
            startDate: "",
            endDate: "",
            current: false,
            gpa: "",
          };

    setFormData((prev) => ({
      ...prev,
      [section]: [...prev[section], newItem],
    }));
  };

  const removeArrayItem = (section, index) => {
    setFormData((prev) => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index),
    }));
  };

  const handleSkillsChange = (e) => {
    const skills = e.target.value
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);
    setFormData((prev) => ({
      ...prev,
      skills,
    }));
  };

  const generateBulletPoints = async (index) => {
    const experience = formData.workExperience[index];
    if (!experience.description) {
      toast.error("Please enter a job description first");
      return;
    }

    setGeneratingBullets(true);
    try {
      // Changed to use api instance
      const response = await api.post("/resume/generate-bullets", {
        experience: experience.description,
        position: experience.position,
        company: experience.company,
      });

      setFormData((prev) => ({
        ...prev,
        workExperience: prev.workExperience.map((exp, i) =>
          i === index
            ? { ...exp, bulletPoints: response.data.bulletPoints }
            : exp
        ),
      }));
      toast.success("Bullet points generated successfully!");
    } catch (error) {
      toast.error("Error generating bullet points");
    } finally {
      setGeneratingBullets(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.title) newErrors.title = "Title is required";
    if (!formData.personalInfo.fullName)
      newErrors["personalInfo.fullName"] = "Full name is required";
    if (!formData.personalInfo.email)
      newErrors["personalInfo.email"] = "Email is required";

    // Validate work experience
    formData.workExperience.forEach((exp, index) => {
      if (!exp.company)
        newErrors[`workExperience.${index}.company`] = "Company is required";
      if (!exp.position)
        newErrors[`workExperience.${index}.position`] = "Position is required";
      if (!exp.startDate)
        newErrors[`workExperience.${index}.startDate`] =
          "Start date is required";
      if (!exp.current && !exp.endDate)
        newErrors[`workExperience.${index}.endDate`] = "End date is required";
    });

    // Validate education
    formData.education.forEach((edu, index) => {
      if (!edu.institution)
        newErrors[`education.${index}.institution`] = "Institution is required";
      if (!edu.degree)
        newErrors[`education.${index}.degree`] = "Degree is required";
      if (!edu.startDate)
        newErrors[`education.${index}.startDate`] = "Start date is required";
      if (!edu.current && !edu.endDate)
        newErrors[`education.${index}.endDate`] = "End date is required";
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      if (id) {
        await api.put(`/resume/${id}`, formData);
        toast.success("Resume updated successfully");
      } else {
        await api.post("/resume", formData);
        toast.success("Resume created successfully");
      }
      navigate("/dashboard");
    } catch (error) {
      toast.error("Error saving resume");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!validateForm()) {
      toast.error("Please fill in all required fields before exporting");
      return;
    }

    try {
      const success = await exportToPDF(formData);
      if (success) {
        toast.success("Resume exported successfully");
      } else {
        toast.error("Error exporting resume");
      }
    } catch (error) {
      toast.error("Error exporting resume");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Resume Details</h2>
        <div className="flex space-x-4">
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          >
            <option value="modern">Modern Template</option>
            <option value="classic">Classic Template</option>
            <option value="minimal">Minimal Template</option>
          </select>
          <button
            type="button"
            onClick={handleExportPDF}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Resume Details
              </h2>
              <button
                type="button"
                onClick={handleExportPDF}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Export PDF
              </button>
            </div>

            {/* Title */}
            <div className="mb-6">
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700"
              >
                Resume Title *
              </label>
              <input
                type="text"
                name="title"
                id="title"
                required
                value={formData.title}
                onChange={handleInputChange}
                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                  errors.title ? "border-red-300" : "border-gray-300"
                }`}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Personal Info */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="personalInfo.fullName"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="personalInfo.fullName"
                    id="personalInfo.fullName"
                    required
                    value={formData.personalInfo.fullName}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                      errors["personalInfo.fullName"]
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                  />
                  {errors["personalInfo.fullName"] && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors["personalInfo.fullName"]}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="personalInfo.email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Email *
                  </label>
                  <input
                    type="email"
                    name="personalInfo.email"
                    id="personalInfo.email"
                    required
                    value={formData.personalInfo.email}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                      errors["personalInfo.email"]
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                  />
                  {errors["personalInfo.email"] && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors["personalInfo.email"]}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="personalInfo.phone"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="personalInfo.phone"
                    id="personalInfo.phone"
                    value={formData.personalInfo.phone}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                      errors["personalInfo.phone"]
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                  />
                  {errors["personalInfo.phone"] && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors["personalInfo.phone"]}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="personalInfo.location"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Location
                  </label>
                  <input
                    type="text"
                    name="personalInfo.location"
                    id="personalInfo.location"
                    value={formData.personalInfo.location}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="personalInfo.linkedin"
                    className="block text-sm font-medium text-gray-700"
                  >
                    LinkedIn
                  </label>
                  <input
                    type="url"
                    name="personalInfo.linkedin"
                    id="personalInfo.linkedin"
                    value={formData.personalInfo.linkedin}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                      errors["personalInfo.linkedin"]
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                  />
                  {errors["personalInfo.linkedin"] && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors["personalInfo.linkedin"]}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="personalInfo.website"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Website
                  </label>
                  <input
                    type="url"
                    name="personalInfo.website"
                    id="personalInfo.website"
                    value={formData.personalInfo.website}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                      errors["personalInfo.website"]
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                  />
                  {errors["personalInfo.website"] && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors["personalInfo.website"]}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="mb-6">
              <label
                htmlFor="summary"
                className="block text-sm font-medium text-gray-700"
              >
                Professional Summary
              </label>
              <textarea
                name="summary"
                id="summary"
                rows="4"
                value={formData.summary}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Write a brief summary of your professional background and career objectives..."
              />
            </div>

            {/* Work Experience */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Work Experience
                </h3>
                <button
                  type="button"
                  onClick={() => addArrayItem("workExperience")}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-primary-700 bg-primary-100 hover:bg-primary-200"
                >
                  Add Experience
                </button>
              </div>
              {formData.workExperience.map((exp, index) => (
                <div key={index} className="mb-6 p-4 border rounded-lg">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Company *
                      </label>
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) =>
                          handleArrayInputChange(
                            "workExperience",
                            index,
                            "company",
                            e.target.value
                          )
                        }
                        className={`mt-1 block w-full rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                          errors[`workExperience.${index}.company`]
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                      />
                      {errors[`workExperience.${index}.company`] && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors[`workExperience.${index}.company`]}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Position *
                      </label>
                      <input
                        type="text"
                        value={exp.position}
                        onChange={(e) =>
                          handleArrayInputChange(
                            "workExperience",
                            index,
                            "position",
                            e.target.value
                          )
                        }
                        className={`mt-1 block w-full rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                          errors[`workExperience.${index}.position`]
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                      />
                      {errors[`workExperience.${index}.position`] && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors[`workExperience.${index}.position`]}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        value={exp.startDate}
                        onChange={(e) =>
                          handleArrayInputChange(
                            "workExperience",
                            index,
                            "startDate",
                            e.target.value
                          )
                        }
                        className={`mt-1 block w-full rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                          errors[`workExperience.${index}.startDate`]
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                      />
                      {errors[`workExperience.${index}.startDate`] && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors[`workExperience.${index}.startDate`]}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        End Date *
                      </label>
                      <input
                        type="date"
                        value={exp.endDate}
                        onChange={(e) =>
                          handleArrayInputChange(
                            "workExperience",
                            index,
                            "endDate",
                            e.target.value
                          )
                        }
                        disabled={exp.current}
                        className={`mt-1 block w-full rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                          errors[`workExperience.${index}.endDate`]
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                      />
                      {errors[`workExperience.${index}.endDate`] && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors[`workExperience.${index}.endDate`]}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      value={exp.description}
                      onChange={(e) =>
                        handleArrayInputChange(
                          "workExperience",
                          index,
                          "description",
                          e.target.value
                        )
                      }
                      rows="3"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="Describe your responsibilities and achievements..."
                    />
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={exp.current}
                        onChange={(e) =>
                          handleArrayInputChange(
                            "workExperience",
                            index,
                            "current",
                            e.target.checked
                          )
                        }
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-900">
                        Current Position
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => generateBulletPoints(index)}
                      disabled={generatingBullets || !exp.description}
                      className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded ${
                        !exp.description
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "text-primary-700 bg-primary-100 hover:bg-primary-200"
                      }`}
                    >
                      {generatingBullets
                        ? "Generating..."
                        : "Generate Bullet Points"}
                    </button>
                  </div>
                  {exp.bulletPoints.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bullet Points
                      </label>
                      <ul className="list-disc pl-5 space-y-1">
                        {exp.bulletPoints.map((point, i) => (
                          <li key={i} className="text-sm text-gray-600">
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeArrayItem("workExperience", index)}
                    className="mt-4 text-sm text-red-600 hover:text-red-800"
                  >
                    Remove Experience
                  </button>
                </div>
              ))}
            </div>

            {/* Education */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Education</h3>
                <button
                  type="button"
                  onClick={() => addArrayItem("education")}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-primary-700 bg-primary-100 hover:bg-primary-200"
                >
                  Add Education
                </button>
              </div>
              {formData.education.map((edu, index) => (
                <div key={index} className="mb-6 p-4 border rounded-lg">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Institution *
                      </label>
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) =>
                          handleArrayInputChange(
                            "education",
                            index,
                            "institution",
                            e.target.value
                          )
                        }
                        className={`mt-1 block w-full rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                          errors[`education.${index}.institution`]
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                      />
                      {errors[`education.${index}.institution`] && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors[`education.${index}.institution`]}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Degree *
                      </label>
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) =>
                          handleArrayInputChange(
                            "education",
                            index,
                            "degree",
                            e.target.value
                          )
                        }
                        className={`mt-1 block w-full rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                          errors[`education.${index}.degree`]
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                      />
                      {errors[`education.${index}.degree`] && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors[`education.${index}.degree`]}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Field of Study
                      </label>
                      <input
                        type="text"
                        value={edu.field}
                        onChange={(e) =>
                          handleArrayInputChange(
                            "education",
                            index,
                            "field",
                            e.target.value
                          )
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        GPA
                      </label>
                      <input
                        type="text"
                        value={edu.gpa}
                        onChange={(e) =>
                          handleArrayInputChange(
                            "education",
                            index,
                            "gpa",
                            e.target.value
                          )
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        value={edu.startDate}
                        onChange={(e) =>
                          handleArrayInputChange(
                            "education",
                            index,
                            "startDate",
                            e.target.value
                          )
                        }
                        className={`mt-1 block w-full rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                          errors[`education.${index}.startDate`]
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                      />
                      {errors[`education.${index}.startDate`] && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors[`education.${index}.startDate`]}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        End Date *
                      </label>
                      <input
                        type="date"
                        value={edu.endDate}
                        onChange={(e) =>
                          handleArrayInputChange(
                            "education",
                            index,
                            "endDate",
                            e.target.value
                          )
                        }
                        disabled={edu.current}
                        className={`mt-1 block w-full rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                          errors[`education.${index}.endDate`]
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                      />
                      {errors[`education.${index}.endDate`] && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors[`education.${index}.endDate`]}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      checked={edu.current}
                      onChange={(e) =>
                        handleArrayInputChange(
                          "education",
                          index,
                          "current",
                          e.target.checked
                        )
                      }
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Currently Studying
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeArrayItem("education", index)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Remove Education
                  </button>
                </div>
              ))}
            </div>

            {/* Skills */}
            <div className="mb-6">
              <label
                htmlFor="skills"
                className="block text-sm font-medium text-gray-700"
              >
                Skills (comma-separated)
              </label>
              <input
                type="text"
                id="skills"
                value={formData.skills.join(", ")}
                onChange={handleSkillsChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="e.g., JavaScript, React, Node.js, Python"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {loading ? "Saving..." : id ? "Update Resume" : "Create Resume"}
              </button>
            </div>
          </div>
        </form>

        <div className="sticky top-4">
          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Preview</h3>
            <div className="overflow-auto max-h-[calc(100vh-200px)]">
              <ResumePreview
                data={formData}
                selectedTemplate={selectedTemplate}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeForm;
