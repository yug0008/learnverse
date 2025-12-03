import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import LatexEditor from '@/lib/latexEditor'
import {
  HiArrowLeft, HiCheck, HiPlus, HiTrash,
  HiSelector, HiHashtag, HiAcademicCap,
  HiBookOpen, HiFolder, HiTag, HiCalendar,
  HiOutlineQuestionMarkCircle, HiCode,
  HiPhotograph, HiCalculator
} from 'react-icons/hi'
import { FaGraduationCap, FaShieldAlt } from 'react-icons/fa'

// Simple Option Editor Component
function SimpleOptionEditor({ value, onChange, label, id }) {
  const textareaRef = useRef(null);

  const insertAtCursor = useCallback((text) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = value || '';
    
    const newText = currentText.substring(0, start) + text + currentText.substring(end);
    onChange(newText);
    
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + text.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 10);
  }, [value, onChange]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-300">
          {label}
        </label>
        <div className="flex space-x-1">
          <button
            type="button"
            onClick={() => insertAtCursor('$$ $$')}
            className="px-2 py-1 bg-blue-900/30 border border-blue-700 text-blue-300 rounded text-xs hover:bg-blue-800/30"
            title="Insert LaTeX"
          >
            LaTeX
          </button>
          <button
            type="button"
            onClick={() => insertAtCursor('\\frac{}{}')}
            className="px-2 py-1 bg-blue-900/30 border border-blue-700 text-blue-300 rounded text-xs hover:bg-blue-800/30"
            title="Insert Fraction"
          >
            a/b
          </button>
          <button
            type="button"
            onClick={() => insertAtCursor('\\sqrt{}')}
            className="px-2 py-1 bg-blue-900/30 border border-blue-700 text-blue-300 rounded text-xs hover:bg-blue-800/30"
            title="Insert Square Root"
          >
            √
          </button>
        </div>
      </div>
      <textarea
        ref={textareaRef}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter option text..."
        rows={3}
        className="w-full px-3 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  );
}

// Numerical Answer Input Component
function NumericalAnswerInput({ value, onChange, label = "Correct Answer" }) {
  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-300">
        {label} *
      </label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Numerical Value
          </label>
          <input
            type="number"
            value={value.answer || ''}
            onChange={(e) => onChange({ ...value, answer: e.target.value })}
            step="any"
            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="e.g., 9.8"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Units (Optional)
          </label>
          <input
            type="text"
            value={value.units || ''}
            onChange={(e) => onChange({ ...value, units: e.target.value })}
            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="m/s², kg, etc."
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Tolerance
          </label>
          <select
            value={value.tolerance || '0'}
            onChange={(e) => onChange({ ...value, tolerance: e.target.value })}
            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="0">Exact Match</option>
            <option value="0.001">±0.001</option>
            <option value="0.01">±0.01</option>
            <option value="0.1">±0.1</option>
            <option value="1">±1</option>
            <option value="5">±5%</option>
            <option value="custom">Custom</option>
          </select>
        </div>
      </div>
      
      {value.tolerance === 'custom' && (
        <div className="mt-2">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Custom Tolerance
          </label>
          <input
            type="text"
            value={value.customTolerance || ''}
            onChange={(e) => onChange({ ...value, customTolerance: e.target.value })}
            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="e.g., 0.05 or 2%"
          />
        </div>
      )}
    </div>
  );
}

export default function CreateQuestion() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [userRole, setUserRole] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  
  // Filter data
  const [exams, setExams] = useState([])
  const [subjects, setSubjects] = useState([])
  const [chapters, setChapters] = useState([])
  const [topics, setTopics] = useState([])
  
  // Form data
  const [formData, setFormData] = useState({
    exam_id: '',
    subject_id: '',
    chapter_id: '',
    topic_id: '',
    question_type: 'objective',
    category: 'PYQ',
    difficulty_category: 'High Output High Input',
    question_blocks: '',
    options: '',
    correct_answer: '',
    solution_blocks: '',
    solution_video_url: '',
    solution_image_url: '',
    year: new Date().getFullYear(),
    month: '',
    shift: '',
    // Add these for numerical questions
    units: '',
    tolerance: '0',
    customTolerance: ''
  })

  const [errors, setErrors] = useState({})
  const [optionsArray, setOptionsArray] = useState([
    { id: 'A', content: '' },
    { id: 'B', content: '' },
    { id: 'C', content: '' },
    { id: 'D', content: '' }
  ])

  useEffect(() => {
    checkUserAndFetchData()
  }, [])

  useEffect(() => {
    if (formData.exam_id) {
      fetchSubjectsByExam(formData.exam_id)
    }
  }, [formData.exam_id])

  useEffect(() => {
    if (formData.subject_id) {
      fetchChaptersBySubject(formData.subject_id)
    }
  }, [formData.subject_id])

  useEffect(() => {
    if (formData.chapter_id) {
      fetchTopicsByChapter(formData.chapter_id)
    }
  }, [formData.chapter_id])

  // Update options JSON when optionsArray changes
  useEffect(() => {
    const options = optionsArray.filter(opt => opt.content.trim())
    if (options.length > 0) {
      const optionsJSON = JSON.stringify(options.map(opt => ({
        id: opt.id,
        blocks: [{ type: 'text', content: opt.content }]
      })))
      setFormData(prev => ({ ...prev, options: optionsJSON }))
    } else {
      setFormData(prev => ({ ...prev, options: '' }))
    }
  }, [optionsArray])

  async function checkUserAndFetchData() {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        router.push('/login?redirect=/admin/questions/new')
        return
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (userError || !userData || !['superadmin', 'admin', 'teacher'].includes(userData.role)) {
        router.push('/not-allowed')
        return
      }

      setUserRole(userData.role)
      await fetchExams()
    } catch (error) {
      console.error('Error:', error)
      router.push('/login')
    }
  }

  async function fetchExams() {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('id, name')
        .order('name')

      if (error) throw error
      setExams(data || [])
    } catch (error) {
      console.error('Error fetching exams:', error)
    }
  }

  async function fetchSubjectsByExam(examId) {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name')
        .eq('exam_id', examId)
        .order('name')

      if (error) throw error
      setSubjects(data || [])
      // Reset dependent fields
      setFormData(prev => ({ ...prev, subject_id: '', chapter_id: '', topic_id: '' }))
    } catch (error) {
      console.error('Error fetching subjects:', error)
    }
  }

  async function fetchChaptersBySubject(subjectId) {
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('id, name')
        .eq('subject_id', subjectId)
        .order('order')

      if (error) throw error
      setChapters(data || [])
      // Reset dependent fields
      setFormData(prev => ({ ...prev, chapter_id: '', topic_id: '' }))
    } catch (error) {
      console.error('Error fetching chapters:', error)
    }
  }

  async function fetchTopicsByChapter(chapterId) {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('id, name')
        .eq('chapter_id', chapterId)
        .order('order')

      if (error) throw error
      setTopics(data || [])
      // Reset topic field
      setFormData(prev => ({ ...prev, topic_id: '' }))
    } catch (error) {
      console.error('Error fetching topics:', error)
    }
  }

  const validateForm = () => {
    const newErrors = {}

    // Basic required fields
    if (!formData.exam_id) newErrors.exam_id = 'Exam is required'
    if (!formData.subject_id) newErrors.subject_id = 'Subject is required'
    if (!formData.chapter_id) newErrors.chapter_id = 'Chapter is required'
    if (!formData.question_blocks.trim()) newErrors.question_blocks = 'Question content is required'
    if (!formData.difficulty_category) newErrors.difficulty_category = 'Difficulty is required'

    // Category specific validation
    if (formData.category === 'PYQ') {
      if (!formData.year) newErrors.year = 'Year is required for PYQ'
      if (formData.year && (formData.year < 2000 || formData.year > new Date().getFullYear())) {
        newErrors.year = 'Year must be between 2000 and current year'
      }
    }

    // Question type specific validation
    if (formData.question_type === 'objective') {
      const validOptions = optionsArray.filter(opt => opt.content.trim())
      if (validOptions.length < 2) newErrors.options = 'At least 2 options are required'
      if (!formData.correct_answer.trim()) newErrors.correct_answer = 'Correct answer is required'
    } else if (formData.question_type === 'numerical') {
      if (!formData.correct_answer.trim()) newErrors.correct_answer = 'Correct answer is required'
      const num = parseFloat(formData.correct_answer)
      if (isNaN(num)) newErrors.correct_answer = 'Must be a valid number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setSubmitting(true)

    try {
      // Prepare question data
      const questionData = {
        id: crypto.randomUUID(),
        exam_id: formData.exam_id,
        subject_id: formData.subject_id,
        chapter_id: formData.chapter_id,
        topic_id: formData.topic_id || null,
        question_type: formData.question_type,
        category: formData.category,
        difficulty_category: formData.difficulty_category,
        question_blocks: formData.question_blocks,
        correct_answer: formData.correct_answer,
        solution_blocks: formData.solution_blocks || null,
        solution_video_url: formData.solution_video_url || null,
        solution_image_url: formData.solution_image_url || null,
        year: formData.category === 'PYQ' ? parseInt(formData.year) : null,
        month: formData.month ? parseInt(formData.month) : null,
        shift: formData.shift || null
      }

      // Add numerical-specific fields
      if (formData.question_type === 'numerical') {
        questionData.units = formData.units || null;
        questionData.tolerance = formData.tolerance || '0';
        questionData.custom_tolerance = formData.customTolerance || null;
      }

      // Add options for objective questions
      if (formData.question_type === 'objective' && formData.options) {
        questionData.options = formData.options
      }

      // Insert question
      const { error } = await supabase
        .from('questions')
        .insert([questionData])

      if (error) throw error

      alert('Question created successfully!')
      router.push('/admin/questions')
    } catch (error) {
      console.error('Error creating question:', error)
      alert('Failed to create question. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleOptionChange = (index, value) => {
    const newOptions = [...optionsArray]
    newOptions[index].content = value
    setOptionsArray(newOptions)
  }

  const addOption = () => {
    const nextId = String.fromCharCode(65 + optionsArray.length)
    setOptionsArray([...optionsArray, { id: nextId, content: '' }])
  }

  const removeOption = (index) => {
    if (optionsArray.length > 2) {
      const newOptions = optionsArray.filter((_, i) => i !== index)
      // Reassign IDs
      const updatedOptions = newOptions.map((opt, i) => ({
        ...opt,
        id: String.fromCharCode(65 + i)
      }))
      setOptionsArray(updatedOptions)
    }
  }

  const difficultyOptions = [
    'High Output High Input',
    'High Output Low Input',
    'Low Output Low Input',
    'Low Output High Input'
  ]

  const monthOptions = [
    { value: '', label: 'Select Month' },
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ]

  const shiftOptions = [
    { value: '', label: 'Select Shift' },
    { value: 'shift-1', label: 'Shift 1' },
    { value: 'shift-2', label: 'Shift 2' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin/questions"
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                <HiArrowLeft className="w-5 h-5 text-gray-300" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Create New Question
                </h1>
                <p className="text-gray-400 mt-2">
                  Add a new question with LaTeX, images, and rich content support
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="px-4 py-2 bg-gray-700/50 rounded-lg flex items-center space-x-2">
                <FaShieldAlt className="w-4 h-4 text-green-400" />
                <span className="text-sm text-gray-300">Role: </span>
                <span className="text-sm font-semibold text-blue-300 capitalize">{userRole}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-700 pb-2">
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Exam */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Exam *
                      </label>
                      <div className="relative">
                        <FaGraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <select
                          name="exam_id"
                          value={formData.exam_id}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-10 py-3 bg-gray-900/50 border ${
                            errors.exam_id ? 'border-red-500/50' : 'border-gray-600'
                          } rounded-xl text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                          required
                        >
                          <option value="">Select Exam</option>
                          {exams.map(exam => (
                            <option key={exam.id} value={exam.id}>
                              {exam.name}
                            </option>
                          ))}
                        </select>
                        <HiSelector className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                      </div>
                      {errors.exam_id && (
                        <p className="mt-2 text-sm text-red-400">{errors.exam_id}</p>
                      )}
                    </div>

                    {/* Subject */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Subject *
                      </label>
                      <div className="relative">
                        <HiBookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <select
                          name="subject_id"
                          value={formData.subject_id}
                          onChange={handleInputChange}
                          disabled={!formData.exam_id}
                          className={`w-full pl-10 pr-10 py-3 bg-gray-900/50 border ${
                            errors.subject_id ? 'border-red-500/50' : 'border-gray-600'
                          } rounded-xl text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50`}
                          required
                        >
                          <option value="">Select Subject</option>
                          {subjects.map(subject => (
                            <option key={subject.id} value={subject.id}>
                              {subject.name}
                            </option>
                          ))}
                        </select>
                        <HiSelector className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                      </div>
                      {errors.subject_id && (
                        <p className="mt-2 text-sm text-red-400">{errors.subject_id}</p>
                      )}
                    </div>

                    {/* Chapter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Chapter *
                      </label>
                      <div className="relative">
                        <HiFolder className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <select
                          name="chapter_id"
                          value={formData.chapter_id}
                          onChange={handleInputChange}
                          disabled={!formData.subject_id}
                          className={`w-full pl-10 pr-10 py-3 bg-gray-900/50 border ${
                            errors.chapter_id ? 'border-red-500/50' : 'border-gray-600'
                          } rounded-xl text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50`}
                          required
                        >
                          <option value="">Select Chapter</option>
                          {chapters.map(chapter => (
                            <option key={chapter.id} value={chapter.id}>
                              {chapter.name}
                            </option>
                          ))}
                        </select>
                        <HiSelector className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                      </div>
                      {errors.chapter_id && (
                        <p className="mt-2 text-sm text-red-400">{errors.chapter_id}</p>
                      )}
                    </div>

                    {/* Topic  */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Topic 
                      </label>
                      <div className="relative">
                        <HiTag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <select
                          name="topic_id"
                          value={formData.topic_id}
                          onChange={handleInputChange}
                          disabled={!formData.chapter_id}
                          className="w-full pl-10 pr-10 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
                        >
                          <option value="">Select Topic (Optional)</option>
                          {topics.map(topic => (
                            <option key={topic.id} value={topic.id}>
                              {topic.name}
                            </option>
                          ))}
                        </select>
                        <HiSelector className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Question Type and Category */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-700 pb-2">
                    Question Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Question Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Question Type *
                      </label>
                      <div className="relative">
                        <HiSelector className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <select
                          name="question_type"
                          value={formData.question_type}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-10 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                          <option value="objective">Objective (MCQ)</option>
                          <option value="numerical">Numerical</option>
                        </select>
                      </div>
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Category *
                      </label>
                      <div className="relative">
                        <HiAcademicCap className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-10 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                          <option value="PYQ">PYQ (Previous Year Questions)</option>
                          <option value="DPP">DPP (Daily Practice Problems)</option>
                        </select>
                      </div>
                    </div>

                    {/* Difficulty */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Difficulty *
                      </label>
                      <div className="relative">
                        <HiOutlineQuestionMarkCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <select
                          name="difficulty_category"
                          value={formData.difficulty_category}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-10 py-3 bg-gray-900/50 border ${
                            errors.difficulty_category ? 'border-red-500/50' : 'border-gray-600'
                          } rounded-xl text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                        >
                          {difficultyOptions.map(diff => (
                            <option key={diff} value={diff}>
                              {diff}
                            </option>
                          ))}
                        </select>
                      </div>
                      {errors.difficulty_category && (
                        <p className="mt-2 text-sm text-red-400">{errors.difficulty_category}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* PYQ Specific Fields */}
                {formData.category === 'PYQ' && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-700 pb-2">
                      PYQ Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Year */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Year *
                        </label>
                        <div className="relative">
                          <HiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                          <input
                            type="number"
                            name="year"
                            value={formData.year}
                            onChange={handleInputChange}
                            min="2000"
                            max={new Date().getFullYear()}
                            className={`w-full pl-10 pr-4 py-3 bg-gray-900/50 border ${
                              errors.year ? 'border-red-500/50' : 'border-gray-600'
                            } rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                            placeholder="2024"
                          />
                        </div>
                        {errors.year && (
                          <p className="mt-2 text-sm text-red-400">{errors.year}</p>
                        )}
                      </div>

                      {/* Month */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Month (Optional)
                        </label>
                        <div className="relative">
                          <HiSelector className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                          <select
                            name="month"
                            value={formData.month}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-10 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          >
                            {monthOptions.map(month => (
                              <option key={month.value} value={month.value}>
                                {month.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Shift */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Shift (Optional)
                        </label>
                        <div className="relative">
                          <HiSelector className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                          <select
                            name="shift"
                            value={formData.shift}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-10 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          >
                            {shiftOptions.map(shift => (
                              <option key={shift.value} value={shift.value}>
                                {shift.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Question Content */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-700 pb-2">
                    Question Content *
                  </h3>
                  <LatexEditor
                    value={formData.question_blocks}
                    onChange={(value) => setFormData(prev => ({ ...prev, question_blocks: value }))}
                    placeholder="Enter question text... Use $$ for LaTeX equations"
                    name="question_blocks"
                    label="Question"
                    required
                    questionType={formData.question_type}
                  />
                  {errors.question_blocks && (
                    <p className="mt-2 text-sm text-red-400">{errors.question_blocks}</p>
                  )}
                </div>

                {/* Options Section - Only for objective questions */}
                {formData.question_type === 'objective' && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-700 pb-2">
                      Options *
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {['A', 'B', 'C', 'D'].map((id) => (
                        <div key={id} className="space-y-2">
                          <SimpleOptionEditor
                            value={optionsArray.find(opt => opt.id === id)?.content || ''}
                            onChange={(value) => {
                              const newOptions = [...optionsArray];
                              const index = newOptions.findIndex(opt => opt.id === id);
                              if (index !== -1) {
                                newOptions[index].content = value;
                                setOptionsArray(newOptions);
                              }
                            }}
                            label={`Option ${id}`}
                            id={id}
                          />
                        </div>
                      ))}
                    </div>
                    {errors.options && (
                      <p className="mt-2 text-sm text-red-400">{errors.options}</p>
                    )}
                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={addOption}
                        className="px-4 py-2 bg-blue-900/30 border border-blue-700 text-blue-300 rounded-lg hover:bg-blue-800/30 flex items-center space-x-2"
                      >
                        <HiPlus className="w-4 h-4" />
                        <span>Add More Options</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Correct Answer - Different for objective vs numerical */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-700 pb-2">
                    Correct Answer *
                  </h3>
                  {formData.question_type === 'objective' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Select Correct Option
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {optionsArray
                          .filter(opt => opt.content.trim())
                          .map((option) => (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, correct_answer: option.id }))}
                              className={`px-5 py-3 rounded-xl border-2 transition-all ${
                                formData.correct_answer === option.id
                                  ? 'border-green-500 bg-green-900/20 text-green-400 shadow-lg scale-105'
                                  : 'border-gray-600 bg-gray-900/50 text-gray-300 hover:border-gray-500 hover:bg-gray-800/50'
                              }`}
                            >
                              <div className="flex flex-col items-center">
                                <span className="text-lg font-bold mb-1">{option.id}</span>
                                <span className="text-xs text-gray-400 max-w-[120px] truncate">
                                  {option.content.substring(0, 30)}{option.content.length > 30 ? '...' : ''}
                                </span>
                              </div>
                            </button>
                          ))}
                      </div>
                      {formData.correct_answer && (
                        <p className="mt-3 text-sm text-green-400">
                          Selected: Option {formData.correct_answer}
                        </p>
                      )}
                    </div>
                  ) : (
                    <NumericalAnswerInput
                      value={{
                        answer: formData.correct_answer,
                        units: formData.units || '',
                        tolerance: formData.tolerance || '0',
                        customTolerance: formData.customTolerance || ''
                      }}
                      onChange={(val) => {
                        setFormData(prev => ({ 
                          ...prev, 
                          correct_answer: val.answer,
                          units: val.units,
                          tolerance: val.tolerance,
                          customTolerance: val.customTolerance
                        }));
                      }}
                      label="Numerical Answer"
                    />
                  )}
                  {errors.correct_answer && (
                    <p className="mt-2 text-sm text-red-400">{errors.correct_answer}</p>
                  )}
                </div>

                {/* Solution Content */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-700 pb-2">
                    Solution (Optional)
                  </h3>
                  <LatexEditor
                    value={formData.solution_blocks}
                    onChange={(value) => setFormData(prev => ({ ...prev, solution_blocks: value }))}
                    placeholder="Enter solution with step-by-step explanation..."
                    name="solution_blocks"
                    label="Solution"
                    questionType={formData.question_type}
                  />
                </div>

                {/* Solution Media */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-700 pb-2">
                    Solution Media (Optional)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Solution Video URL
                      </label>
                      <input
                        type="url"
                        name="solution_video_url"
                        value={formData.solution_video_url}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="https://youtube.com/watch?v=..."
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-6 border-t border-gray-700">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Creating Question...
                      </>
                    ) : (
                      <>
                        <HiCheck className="w-5 h-5 mr-2" />
                        Create Question
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Info Section */}
          <div>
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700 p-6 sticky top-8">
              {/* Info Card */}
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <HiOutlineQuestionMarkCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white text-center mb-2">
                  Question Creation Guide
                </h3>
                <p className="text-gray-400 text-sm text-center">
                  Create rich educational content with LaTeX support
                </p>
              </div>

              {/* Features */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Supported Features</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                    <span>LaTeX Math Expressions ($$...$$)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                    <span>Chemistry Reactions & Symbols</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                    <span>Image Embedding Support</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                    <span>Rich Text Formatting</span>
                  </li>
                </ul>
              </div>

              {/* Tips */}
              <div className="mb-6 pt-6 border-t border-gray-700">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Tips</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>• Use $$ for LaTeX equations</li>
                  <li>• Click LaTeX button for math symbols</li>
                  <li>• Add images for diagrams and visuals</li>
                  <li>• For numerical: include units</li>
                </ul>
              </div>

              {/* Quick Actions */}
              <div className="pt-6 border-t border-gray-700">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Quick Actions</h4>
                <div className="space-y-2">
                  <Link
                    href="/admin/questions"
                    className="block px-4 py-3 bg-gray-700/50 hover:bg-gray-700 border border-gray-600 rounded-lg transition-colors text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">View All Questions</span>
                      <HiArrowLeft className="w-4 h-4 text-gray-300 rotate-180" />
                    </div>
                  </Link>
                  <Link
                    href="/admin/topics"
                    className="block px-4 py-3 bg-gray-700/50 hover:bg-gray-700 border border-gray-600 rounded-lg transition-colors text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Manage Topics</span>
                      <HiTag className="w-4 h-4 text-gray-300" />
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}