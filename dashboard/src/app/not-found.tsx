"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, Compass, Map, Search } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-white">
            <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
                {/* Animated Icon Container */}
                <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
                    <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping duration-[3s]" />
                    <div className="relative bg-white p-6 rounded-full shadow-xl border border-primary/20">
                        <Compass className="h-16 w-16 text-primary animate-pulse" />
                    </div>
                    <div className="absolute top-0 right-0 bg-secondary rounded-full p-2 shadow-lg border border-white">
                        <Search className="h-4 w-4 text-white" />
                    </div>
                </div>

                {/* Text Content */}
                <div className="space-y-3">
                    <h1 className="text-8xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary-dark to-primary/60 tracking-tighter">
                        404
                    </h1>
                    <h2 className="text-2xl font-bold font-playfair text-gray-900">
                        Halaman Tidak Ditemukan
                    </h2>
                    <p className="text-gray-500 max-w-xs mx-auto">
                        Maaf, sepertinya Anda tersesat di tengah tawaf. Halaman yang Anda cari tidak tersedia.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 flex flex-col gap-3">
                    <Button asChild className="w-full h-12 text-lg shadow-lg hover:shadow-xl transition-all">
                        <Link href="/">
                            <Home className="mr-2 h-5 w-5" />
                            Kembali ke Beranda
                        </Link>
                    </Button>
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                        <Map className="h-3 w-3" />
                        <span>Pastikan URL yang Anda masukkan sudah benar</span>
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="pt-12 text-gray-300 font-light flex items-center justify-center gap-4">
                    <div className="h-px w-12 bg-current" />
                    <span className="text-xs uppercase tracking-widest">Sahabat Qolbu Travel</span>
                    <div className="h-px w-12 bg-current" />
                </div>
            </div>
        </div>
    );
}
