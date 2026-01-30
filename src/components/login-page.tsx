'use client';

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { AkiorLogo } from "./jarvis-logo";

export function LoginPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />

            {/* Logo and title */}
            <div className="relative z-10 w-full max-w-md space-y-8">
                <div className="text-center space-y-4">
                    <div className="flex justify-center">
                        <AkiorLogo size="lg" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">AKIOR Console</h1>
                        <p className="text-muted-foreground mt-2">
                            Your personal AI assistant with knowledge base
                        </p>
                    </div>
                </div>

                {/* Auth form */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-xl">
                    <Auth
                        supabaseClient={supabase}
                        providers={[]}
                        appearance={{
                            theme: ThemeSupa,
                            variables: {
                                default: {
                                    colors: {
                                        brand: "hsl(190, 90%, 50%)",
                                        brandAccent: "hsl(190, 90%, 45%)",
                                        brandButtonText: "hsl(220, 25%, 5%)",
                                        defaultButtonBackground: "hsl(220, 20%, 18%)",
                                        defaultButtonBackgroundHover: "hsl(220, 20%, 22%)",
                                        defaultButtonBorder: "hsl(220, 20%, 25%)",
                                        defaultButtonText: "hsl(210, 20%, 90%)",
                                        dividerBackground: "hsl(220, 20%, 20%)",
                                        inputBackground: "hsl(220, 20%, 15%)",
                                        inputBorder: "hsl(220, 20%, 25%)",
                                        inputBorderHover: "hsl(190, 90%, 50%)",
                                        inputBorderFocus: "hsl(190, 90%, 50%)",
                                        inputText: "hsl(210, 20%, 90%)",
                                        inputLabelText: "hsl(210, 10%, 55%)",
                                        inputPlaceholder: "hsl(210, 10%, 45%)",
                                        messageText: "hsl(210, 20%, 90%)",
                                        messageTextDanger: "hsl(0, 70%, 60%)",
                                        anchorTextColor: "hsl(190, 90%, 50%)",
                                        anchorTextHoverColor: "hsl(190, 90%, 60%)"
                                    },
                                    space: {
                                        spaceSmall: "4px",
                                        spaceMedium: "8px",
                                        spaceLarge: "16px",
                                        labelBottomMargin: "8px",
                                        anchorBottomMargin: "4px",
                                        emailInputSpacing: "4px",
                                        socialAuthSpacing: "4px",
                                        buttonPadding: "12px 16px",
                                        inputPadding: "12px 16px"
                                    },
                                    borderWidths: {
                                        buttonBorderWidth: "1px",
                                        inputBorderWidth: "1px"
                                    },
                                    radii: {
                                        borderRadiusButton: "8px",
                                        buttonBorderRadius: "8px",
                                        inputBorderRadius: "8px"
                                    },
                                    fonts: {
                                        bodyFontFamily: "inherit",
                                        buttonFontFamily: "inherit",
                                        inputFontFamily: "inherit",
                                        labelFontFamily: "inherit"
                                    }
                                }
                            },
                            className: {
                                container: "auth-container",
                                button: "auth-button",
                                input: "auth-input",
                                label: "auth-label"
                            }
                        }}
                        theme="dark"
                        localization={{
                            variables: {
                                sign_in: {
                                    email_label: "Email",
                                    password_label: "Password",
                                    button_label: "Sign In",
                                    link_text: "Don't have an account? Sign up"
                                },
                                sign_up: {
                                    email_label: "Email",
                                    password_label: "Password",
                                    button_label: "Create Account",
                                    link_text: "Already have an account? Sign in"
                                }
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    );
}