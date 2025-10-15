"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Zap, Star, Heart } from "lucide-react";

export default function LiquidGlassDemo() {
  const [activeCard, setActiveCard] = useState<number | null>(null);

  return (
    <div className="min-h-screen p-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          Liquid Glass UI Demo
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Demonstrasi efek Liquid Glass yang terinspirasi dari desain Apple, 
          dengan backdrop blur, transparansi dinamis, dan animasi yang halus.
        </p>
      </div>

      {/* Interactive Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((index) => (
          <Card
            key={index}
            className={`
              glass-surface transition-all duration-500 cursor-pointer
              ${activeCard === index ? 'liquid-glass-active scale-105' : 'liquid-glass-hover'}
              relative overflow-hidden group
            `}
            onMouseEnter={() => setActiveCard(index)}
            onMouseLeave={() => setActiveCard(null)}
          >
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-purple-500/10 to-pink-500/10 
                           opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <CardHeader>
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-500">
                  {index === 1 && <Sparkles className="h-4 w-4 text-white" />}
                  {index === 2 && <Zap className="h-4 w-4 text-white" />}
                  {index === 3 && <Star className="h-4 w-4 text-white" />}
                  {index === 4 && <Heart className="h-4 w-4 text-white" />}
                  {index === 5 && <Sparkles className="h-4 w-4 text-white" />}
                  {index === 6 && <Zap className="h-4 w-4 text-white" />}
                </div>
                <div>
                  <CardTitle className="text-lg">Liquid Glass Card {index}</CardTitle>
                  <CardDescription>Interactive glass morphism effect</CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Efek kaca cair dengan backdrop blur, transparansi adaptif, 
                dan animasi yang smooth seperti desain Apple.
              </p>
              
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="glass-surface">
                  Frosted Glass
                </Badge>
                <Badge variant="outline" className="border-white/20">
                  Smooth Transition
                </Badge>
              </div>

              <Button 
                size="sm" 
                className="w-full glass-surface border border-white/20 hover:border-white/40
                          transition-all duration-300 hover:scale-105"
              >
                Interact with Glass
              </Button>
            </CardContent>

            {/* Ripple effect overlay */}
            {activeCard === index && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent 
                               animate-shimmer" />
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Feature Showcase */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-center">Liquid Glass Features</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Backdrop Blur Demo */}
          <div className="relative h-48 rounded-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500" />
            <div className="absolute inset-4 glass-surface rounded-lg flex items-center justify-center">
              <div className="text-center space-y-2">
                <h3 className="font-semibold">Backdrop Blur</h3>
                <p className="text-sm text-muted-foreground">20px blur radius</p>
              </div>
            </div>
          </div>

          {/* Transparency Demo */}
          <div className="relative h-48 rounded-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500 via-teal-500 to-blue-500" />
            <div className="absolute inset-4 liquid-glass-active rounded-lg flex items-center justify-center">
              <div className="text-center space-y-2">
                <h3 className="font-semibold">Dynamic Opacity</h3>
                <p className="text-sm text-muted-foreground">8% transparency</p>
              </div>
            </div>
          </div>

          {/* Animation Demo */}
          <div className="relative h-48 rounded-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-red-500 to-pink-500" />
            <div className="absolute inset-4 liquid-glass-hover rounded-lg flex items-center justify-center 
                           hover:scale-105 transition-transform duration-300">
              <div className="text-center space-y-2">
                <h3 className="font-semibold">Smooth Animation</h3>
                <p className="text-sm text-muted-foreground">Hover to see effect</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Elements */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-center">Interactive Elements</h2>
        
        <div className="flex flex-wrap gap-4 justify-center">
          <Button className="glass-surface border border-white/20 hover:border-white/40">
            Glass Button
          </Button>
          <Button variant="outline" className="liquid-glass-hover">
            Liquid Button
          </Button>
          <Button className="liquid-glass-active">
            Active Glass
          </Button>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>💡 Tip: Tahan tombol theme switcher untuk mengaktifkan mode Liquid Glass!</p>
        </div>
      </div>
    </div>
  );
}
