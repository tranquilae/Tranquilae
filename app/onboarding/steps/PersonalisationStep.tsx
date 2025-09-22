'use client';

import React, { useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { User, Calendar, Weight, Ruler } from 'lucide-react';

const LottiePlayer = React.lazy(() => 
  import('@lottiefiles/react-lottie-player').then(module => ({ default: module.Player }))
);

const PersonaliseSVG = () => (
  <div className="w-40 h-40 flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 rounded-full">
    <div className="text-5xl">👤</div>
  </div>
);

interface PersonalData {
  name?: string;
  dateOfBirth?: string;
  sex?: 'male' | 'female' | 'other';
  height?: number;
  weight?: number;
}

interface PersonalisationStepProps {
  onNext: (data: PersonalData) => void;
  onBack: () => void;
  initialData?: PersonalData;
  isLoading?: boolean;
  error?: string | null;
}

const sexOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

const PersonalisationStep: React.FC<PersonalisationStepProps> = ({ 
  onNext, 
  onBack, 
  initialData, 
  isLoading, 
  error 
}) => {
  const [form, setForm] = useState({
    name: initialData?.name || '',
    dateOfBirth: initialData?.dateOfBirth || '',
    sex: initialData?.sex || '',
    weight: initialData?.weight?.toString() || '',
    height: initialData?.height?.toString() || '',
  });
  const [touched, setTouched] = useState<{ [k: string]: boolean }>({});
  const [lottieError, setLottieError] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (value: string, name: string) => {
    setForm({ ...form, [name]: value });
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched({ ...touched, [e.target.name]: true });
  };

  // Validation functions
  const isValidName = form.name.trim().length >= 2;
  const isValidDateOfBirth = form.dateOfBirth ? new Date(form.dateOfBirth) <= new Date() : true;
  const isValidWeight = !form.weight || (Number(form.weight) > 0 && Number(form.weight) <= 500);
  const isValidHeight = !form.height || (Number(form.height) > 30 && Number(form.height) <= 250);
  
  const isValid = isValidName;
  const canProceed = isValid && !isLoading;

  const handleContinue = () => {
    if (!canProceed) return;
    
    const personalData: PersonalData = {
      name: form.name.trim(),
      dateOfBirth: form.dateOfBirth || undefined,
      sex: form.sex as 'male' | 'female' | 'other' || undefined,
      weight: form.weight ? Number(form.weight) : undefined,
      height: form.height ? Number(form.height) : undefined,
    };
    
    onNext(personalData);
  };

  return (
    <div className="flex flex-col items-center space-y-8">
      {/* Hero Animation */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
      >
        <Suspense fallback={<PersonaliseSVG />}>
          {!lottieError ? (
            <LottiePlayer
              autoplay
              loop
              src="https://lottie.host/personalise-animation/data.json"
              style={{ height: '160px', width: '160px' }}
              onError={() => setLottieError(true)}
            />
          ) : (
            <PersonaliseSVG />
          )}
        </Suspense>
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center space-y-2"
      >
        <h2 className="text-3xl font-bold text-[#6ba368]">Tell Us About Yourself</h2>
        <p className="text-gray-600">Help us personalize your wellness journey</p>
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-md"
      >
        <Card className="bg-white/80 backdrop-blur-sm border-white/20">
          <CardContent className="p-6">
            <form 
              className="space-y-6" 
              onSubmit={(e) => { e.preventDefault(); handleContinue(); }}
            >
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Full Name *
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className="bg-white/90 border-gray-200 focus:border-[#6ba368] focus:ring-[#6ba368]"
                  aria-describedby={touched.name && !isValidName ? "name-error" : undefined}
                  required
                />
                {touched.name && !isValidName && (
                  <p id="name-error" className="text-red-500 text-xs" role="alert">
                    Please enter at least 2 characters for your name.
                  </p>
                )}
              </div>

              {/* Date of Birth */}
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date of Birth
                </Label>
                <Input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className="bg-white/90 border-gray-200 focus:border-[#6ba368] focus:ring-[#6ba368]"
                  max={new Date().toISOString().split('T')[0]}
                />
                {touched.dateOfBirth && !isValidDateOfBirth && (
                  <p className="text-red-500 text-xs" role="alert">
                    Please enter a valid date of birth.
                  </p>
                )}
              </div>

              {/* Sex Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Sex (Optional)
                </Label>
                <Select value={form.sex} onValueChange={(value) => handleSelectChange(value, 'sex')}>
                  <SelectTrigger className="bg-white/90 border-gray-200 focus:border-[#6ba368] focus:ring-[#6ba368]">
                    <SelectValue placeholder="Select if you'd like" />
                  </SelectTrigger>
                  <SelectContent>
                    {sexOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Physical Measurements */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="height" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Ruler className="w-4 h-4" />
                    Height
                  </Label>
                  <div className="relative">
                    <Input
                      id="height"
                      name="height"
                      type="number"
                      placeholder="170"
                      value={form.height}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className="bg-white/90 border-gray-200 focus:border-[#6ba368] focus:ring-[#6ba368] pr-12"
                      min="30"
                      max="250"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">cm</span>
                  </div>
                  {touched.height && !isValidHeight && (
                    <p className="text-red-500 text-xs" role="alert">
                      Enter height between 30-250 cm.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Weight className="w-4 h-4" />
                    Weight
                  </Label>
                  <div className="relative">
                    <Input
                      id="weight"
                      name="weight"
                      type="number"
                      placeholder="70"
                      value={form.weight}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className="bg-white/90 border-gray-200 focus:border-[#6ba368] focus:ring-[#6ba368] pr-12"
                      min="1"
                      max="500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">kg</span>
                  </div>
                  {touched.weight && !isValidWeight && (
                    <p className="text-red-500 text-xs" role="alert">
                      Enter weight between 1-500 kg.
                    </p>
                  )}
                </div>
              </div>

              {/* Privacy Notice */}
              <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
                🔒 Your personal information is encrypted and never shared with third parties.
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  className="flex-1 border-gray-200 hover:bg-gray-50"
                  disabled={isLoading}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={!canProceed}
                  className="flex-1 bg-[#6ba368] hover:bg-[#5a8c57] text-white"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    'Continue'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Optional fields notice */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-xs text-gray-400 text-center max-w-md"
      >
        Physical measurements are optional but help us provide more personalized recommendations
      </motion.p>
    </div>
  );
};

export default PersonalisationStep;
