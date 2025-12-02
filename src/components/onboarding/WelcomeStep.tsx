import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dumbbell, Sparkles, ArrowRight } from "lucide-react";

interface WelcomeStepProps {
  nickname: string;
  onNicknameChange: (nickname: string) => void;
  onNext: () => void;
}

export const WelcomeStep = ({ nickname, onNicknameChange, onNext }: WelcomeStepProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in">
      <div className="relative mb-8">
        <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center animate-pulse">
          <Dumbbell className="w-12 h-12 text-primary" />
        </div>
        <Sparkles className="w-6 h-6 text-primary absolute -top-2 -right-2 animate-bounce" />
      </div>

      <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
        Welcome to Smart Fitness!
      </h1>
      
      <p className="text-lg text-muted-foreground mb-8 max-w-md">
        Let's personalize your experience in just 2 minutes. We'll set up your goals, 
        preferences, and equipment so every workout is tailored just for you.
      </p>

      <div className="w-full max-w-sm mb-8">
        <Label htmlFor="nickname" className="text-left block mb-2">
          What should we call you? (optional)
        </Label>
        <Input
          id="nickname"
          placeholder="Enter your name or nickname"
          value={nickname}
          onChange={(e) => onNicknameChange(e.target.value)}
          className="text-center text-lg"
        />
      </div>

      <Button 
        size="lg" 
        onClick={onNext}
        className="group"
      >
        Let's Get Started
        <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </Button>
    </div>
  );
};
