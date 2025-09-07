
'use client';

import type { GenerateOptimizedCvOutput } from "@/ai/flows/generate-optimized-cv";
import { Award, Briefcase, FileText, Globe, GraduationCap, Languages, Linkedin, Mail, MapPin, Phone, Star } from "lucide-react";
import React from 'react';

// Adjusting types to accept data from DB or from generation
type CVData = Partial<GenerateOptimizedCvOutput> & {
  professional_summary?: string;
  work_experience?: any[];
  academic_background?: any[];
  contact_info?: {
    email: string;
    telefono: string;
    ubicacion: string;
    linkedin?: string;
    sitio_web?: string;
  };
};

interface CvPreviewProps {
  cvData: CVData;
  style: 'Minimalist' | 'Modern' | 'Classic';
  fullName?: string;
  profilePicUrl?: string | null;
}

export function CvPreview({ cvData, style, fullName, profilePicUrl }: CvPreviewProps) {

  // This function is a helper to render a section only if it has content.
  const renderSection = (title: string, icon: React.ReactNode, content: any) => {
    if (!content || (Array.isArray(content) && content.length === 0)) {
      return null;
    }

    return (
      <div className="mt-4">
        <h3 className="cv-section-title">
          {icon}
          {title}
        </h3>
        {content}
      </div>
    );
  };
  
  if (!cvData) {
    return <div className="cv-preview-container">Cargando vista previa...</div>;
  }
  
  // Normalize data for preview
  const { 
    title, 
    resumen_profesional, 
    experiencia_laboral, 
    formacion_academica, 
    habilidades, 
    idiomas, 
    certificaciones, 
    contacto 
  } = {
    title: cvData.title || '',
    resumen_profesional: cvData.resumen_profesional || cvData.professional_summary || '',
    experiencia_laboral: cvData.experiencia_laboral || cvData.work_experience || [],
    formacion_academica: cvData.formacion_academica || cvData.academic_background || [],
    habilidades: cvData.habilidades || { tecnicas: [], blandas: [] },
    idiomas: cvData.idiomas || [],
    certificaciones: cvData.certificaciones || [],
    contacto: cvData.contacto || cvData.contact_info || { email: '', telefono: '', ubicacion: '' }
  };


  // For modern style, we split content into two columns
  if (style === 'Modern') {
    return (
      <div className="cv-preview-container cv-grid">
        <div className="cv-sidebar-col">
          {profilePicUrl && <img src={profilePicUrl} alt="Foto de perfil" className="cv-profile-pic" />}
          
          {renderSection('Contacto', <Mail size={12} />, (
            <div className="space-y-1">
              {contacto.email && <p className="cv-contact-item"><Mail size={12}/><span>{contacto.email}</span></p>}
              {contacto.telefono && <p className="cv-contact-item"><Phone size={12}/><span>{contacto.telefono}</span></p>}
              {contacto.ubicacion && <p className="cv-contact-item"><MapPin size={12}/><span>{contacto.ubicacion}</span></p>}
              {contacto.linkedin && <p className="cv-contact-item"><Linkedin size={12}/><span>{contacto.linkedin}</span></p>}
              {contacto.sitio_web && <p className="cv-contact-item"><Globe size={12}/><span>{contacto.sitio_web}</span></p>}
            </div>
          ))}

          {renderSection('Habilidades Técnicas', <Star size={12} />, (
            <div className="cv-skills-list">
              {habilidades?.tecnicas?.map(skill => <span key={skill} className="cv-skill-item">{skill}</span>)}
            </div>
          ))}
          
          {renderSection('Habilidades Blandas', <Star size={12} />, (
            <div className="cv-skills-list">
              {habilidades?.blandas?.map(skill => <span key={skill} className="cv-skill-item">{skill}</span>)}
            </div>
          ))}

          {renderSection('Idiomas', <Languages size={12} />, (
             <ul className="list-disc list-inside cv-text-xs space-y-1 pl-1">
              {idiomas?.map(lang => <li key={lang}>{lang}</li>)}
            </ul>
          ))}
          
          {renderSection('Certificaciones', <Award size={12} />, (
            <ul className="list-disc list-inside cv-text-xs space-y-1 pl-1">
              {certificaciones?.map(cert => <li key={cert}>{cert}</li>)}
            </ul>
          ))}
        </div>

        <div className="cv-main-col">
           <header className="cv-header text-left mb-6">
              {fullName && <h1>{fullName}</h1>}
              <h2>{title}</h2>
          </header>
          
          {renderSection('Resumen Profesional', <FileText size={14}/>, <p className="cv-text-sm">{resumen_profesional}</p>)}

          {renderSection('Experiencia Laboral', <Briefcase size={14}/>, (
            <div className="space-y-3">
              {experiencia_laboral?.map((exp, i) => (
                <div key={i} className="cv-exp-item">
                  <p className="cv-exp-title">{exp.puesto}</p>
                  <p className="cv-exp-subtitle">{exp.empresa} | {exp.fecha}</p>
                  <p className="cv-exp-desc">{exp.descripcion}</p>
                </div>
              ))}
            </div>
          ))}

          {renderSection('Formación Académica', <GraduationCap size={14}/>, (
            <div className="space-y-3">
              {formacion_academica?.map((edu, i) => (
                <div key={i} className="cv-edu-item">
                  <p className="cv-edu-title">{edu.titulo}</p>
                  <p className="cv-edu-subtitle">{edu.institucion} | {edu.fecha}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Fallback for other styles (Minimalist, Classic) - single column layout
  return (
    <div className={`cv-preview-container cv-style-${style?.toLowerCase()}`}>
        <header className="cv-header text-center mb-6">
             {profilePicUrl && <img src={profilePicUrl} alt="Foto de perfil" className="cv-profile-pic" />}
            {fullName && <h1>{fullName}</h1>}
            <h2>{title}</h2>
            <div className="flex justify-center flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mt-2">
                {contacto.email && <span className="flex items-center gap-1.5"><Mail size={12}/>{contacto.email}</span>}
                {contacto.telefono && <span className="flex items-center gap-1.5"><Phone size={12}/>{contacto.telefono}</span>}
                {contacto.ubicacion && <span className="flex items-center gap-1.5"><MapPin size={12}/>{contacto.ubicacion}</span>}
                {contacto.linkedin && <span className="flex items-center gap-1.5"><Linkedin size={12}/>{contacto.linkedin}</span>}
                {contacto.sitio_web && <span className="flex items-center gap-1.5"><Globe size={12}/>{contacto.sitio_web}</span>}
            </div>
        </header>

        {renderSection('Resumen Profesional', <FileText size={14}/>, <p className="cv-text-sm text-center">{resumen_profesional}</p>)}

        {renderSection('Experiencia Laboral', <Briefcase size={14}/>, (
            <div className="space-y-3">
                {experiencia_laboral?.map((exp, i) => (
                <div key={i} className="cv-exp-item">
                    <p className="cv-exp-title">{exp.puesto}</p>
                    <p className="cv-exp-subtitle">{exp.empresa} | {exp.fecha}</p>
                    <p className="cv-exp-desc">{exp.descripcion}</p>
                </div>
                ))}
            </div>
        ))}

        {renderSection('Formación Académica', <GraduationCap size={14}/>, (
            <div className="space-y-3">
                {formacion_academica?.map((edu, i) => (
                <div key={i} className="cv-edu-item">
                    <p className="cv-edu-title">{edu.titulo}</p>
                    <p className="cv-edu-subtitle">{edu.institucion} | {edu.fecha}</p>
                </div>
                ))}
            </div>
        ))}
        
        <div className="grid grid-cols-2 gap-6">
            {renderSection('Habilidades Técnicas', <Star size={12} />, (
                <ul className="list-disc list-inside cv-text-xs space-y-1 pl-1">
                {habilidades?.tecnicas?.map(skill => <li key={skill}>{skill}</li>)}
                </ul>
            ))}
            
            {renderSection('Habilidades Blandas', <Star size={12} />, (
                <ul className="list-disc list-inside cv-text-xs space-y-1 pl-1">
                {habilidades?.blandas?.map(skill => <li key={skill}>{skill}</li>)}
                </ul>
            ))}
        </div>


        {renderSection('Idiomas', <Languages size={12} />, (
            <ul className="list-disc list-inside cv-text-xs space-y-1 pl-1">
            {idiomas?.map(lang => <li key={lang}>{lang}</li>)}
            </ul>
        ))}
        
        {renderSection('Certificaciones', <Award size={12} />, (
            <ul className="list-disc list-inside cv-text-xs space-y-1 pl-1">
            {certificaciones?.map(cert => <li key={cert}>{cert}</li>)}
            </ul>
        ))}
    </div>
  )
}
