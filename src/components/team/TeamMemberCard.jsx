import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Mail, Linkedin, Crown, Edit, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from '@/contexts/UserContext';
import { canManageTeamMember } from '@/lib/permissions';

// Custom Hook for outside click detection
const useOutsideClick = (ref, onOutsideClick) => {
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!ref.current || ref.current.contains(event.target)) {
                return;
            }
            onOutsideClick();
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, [ref, onOutsideClick]);
};

// Team Member Card Component
export const TeamMemberCard = ({
    member,
    index,
    onEdit,
    onCardClose = () => {},
}) => {
    const { user } = useUser();
    const [isExpanded, setIsExpanded] = useState(false);
    const containerRef = useRef(null);

    const handleExpand = () => {
        setIsExpanded(true);
    };
    
    const handleCollapse = () => {
        setIsExpanded(false);
        onCardClose();
    };

    const handleEdit = () => {
        handleCollapse();
        if (onEdit) {
            onEdit(member);
        }
    };

    useEffect(() => {
        const handleEscapeKey = (event) => {
            if (event.key === "Escape") {
                handleCollapse();
            }
        };

        if (isExpanded) {
            const scrollY = window.scrollY;
            document.body.style.position = "fixed";
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = "100%";
            document.body.style.overflow = "hidden";
            document.body.dataset.scrollY = scrollY.toString();
        } else {
            const scrollY = parseInt(document.body.dataset.scrollY || "0", 10);
            document.body.style.position = "";
            document.body.style.top = "";
            document.body.style.width = "";
            document.body.style.overflow = "";
            window.scrollTo({ top: scrollY, behavior: "instant" });
        }

        if (isExpanded) {
            window.addEventListener("keydown", handleEscapeKey);
        }
        
        return () => {
            window.removeEventListener("keydown", handleEscapeKey);
        };
    }, [isExpanded]);

    useOutsideClick(containerRef, handleCollapse);

    // Gradient backgrounds for variety
    const gradients = [
        "from-slate-50 to-indigo-50",
        "from-indigo-50 to-purple-50", 
        "from-purple-50 to-pink-50",
        "from-emerald-50 to-teal-50",
        "from-amber-50 to-orange-50"
    ];
    const gradient = gradients[index % gradients.length];

    const canEdit = canManageTeamMember(user, member);

    return (
        <>
            <AnimatePresence>
                {isExpanded && (
                    <div className="fixed inset-0 h-screen overflow-hidden z-50">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="bg-black/60 backdrop-blur-lg h-full w-full fixed inset-0"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            ref={containerRef}
                            className={`max-w-5xl mx-auto bg-gradient-to-b ${gradient} min-h-[600px] z-[60] p-8 md:p-12 rounded-3xl relative mt-10 mx-4 md:mx-auto`}
                            style={{ maxHeight: '90vh', overflowY: 'auto' }}
                        >
                            <button
                                className="sticky top-4 h-10 w-10 right-0 ml-auto rounded-full flex items-center justify-center bg-slate-800 hover:bg-slate-700 transition-colors"
                                onClick={handleCollapse}
                            >
                                <X className="h-5 w-5 text-white" />
                            </button>
                            
                            <div className="flex flex-col md:flex-row gap-8 items-start mt-8">
                                <div className="flex-shrink-0">
                                    <ProfileImage 
                                        src={member.profile_image || member.profileImage} 
                                        alt={member.name}
                                        size="large"
                                    />
                                </div>
                                
                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <p className="text-indigo-600 text-lg font-medium mb-2">
                                                {member.role}
                                                {member.is_decision_maker && (
                                                    <Crown className="inline-block w-5 h-5 ml-2 text-amber-500" />
                                                )}
                                            </p>
                                            
                                            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">
                                                {member.name}
                                            </h2>
                                            
                                            <div className="flex gap-2 mt-2">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                    member.team_type === 'client' 
                                                        ? 'bg-green-100 text-green-700 border border-green-200'
                                                        : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                                                }`}>
                                                    {member.team_type === 'client' ? 'Client' : 'Agency'}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {canEdit && (
                                            <button
                                                onClick={handleEdit}
                                                className="p-2 rounded-lg bg-slate-200 hover:bg-slate-300 transition-colors"
                                                title="Edit team member"
                                            >
                                                <Edit className="w-5 h-5 text-slate-700" />
                                            </button>
                                        )}
                                    </div>
                                    
                                    <div className="prose prose-lg text-slate-700 mb-8">
                                        <p className="leading-relaxed">
                                            {member.bio || member.description}
                                        </p>
                                        
                                        {member.expertise && (
                                            <div className="mt-6">
                                                <h3 className="text-xl font-semibold text-slate-800 mb-3">Expertise</h3>
                                                <p>{member.expertise}</p>
                                            </div>
                                        )}
                                        
                                        {member.personal && (
                                            <div className="mt-6">
                                                <h3 className="text-xl font-semibold text-slate-800 mb-3">Personal Touch</h3>
                                                <p className="italic">{member.personal}</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-4">
                                        {member.email && (
                                            <a
                                                href={`mailto:${member.email}`}
                                                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                                            >
                                                <Mail className="w-5 h-5" />
                                                Contact via Email
                                            </a>
                                        )}
                                        
                                        {member.linkedin_url && (
                                            <a
                                                href={member.linkedin_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                            >
                                                <Linkedin className="w-5 h-5" />
                                                Connect on LinkedIn
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="cursor-pointer"
                onClick={handleExpand}
                whileHover={{
                    scale: 1.02,
                    transition: { duration: 0.2, ease: "easeOut" },
                }}
            >
                <div className={`relative rounded-2xl bg-gradient-to-b ${gradient} h-[380px] md:h-[420px] w-full overflow-hidden flex flex-col items-center justify-center shadow-lg hover:shadow-xl transition-shadow border border-slate-200/50`}>
                    {/* Subtle pattern overlay */}
                    <div className="absolute inset-0 opacity-5">
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-transparent" />
                    </div>
                    
                    {/* Decision Maker Badge */}
                    {member.is_decision_maker && (
                        <div className="absolute top-4 right-4 bg-amber-500 text-white px-2 py-1 rounded-full flex items-center gap-1 shadow-md">
                            <Crown className="w-3 h-3" />
                            <span className="text-xs font-semibold">Decision Maker</span>
                        </div>
                    )}
                    
                    {/* Team Type Badge */}
                    <div className={`absolute top-4 left-4 px-2 py-1 rounded-full text-xs font-semibold shadow-sm ${
                        member.team_type === 'client' 
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                    }`}>
                        {member.team_type === 'client' ? 'Client' : 'Agency'}
                    </div>
                    
                    <ProfileImage 
                        src={member.profile_image || member.profileImage} 
                        alt={member.name} 
                    />
                    
                    <h3 className="text-slate-900 text-xl font-bold text-center mt-4 px-4">
                        {member.name}
                    </h3>
                    
                    <p className="text-slate-600 text-base font-medium text-center mt-1">
                        {member.role}
                    </p>
                    
                    <p className="text-slate-700 text-sm text-center mt-3 px-4 line-clamp-2">
                        {member.shortBio || (member.bio && member.bio.length > 100 
                            ? `${member.bio.slice(0, 100)}...`
                            : member.bio)}
                    </p>
                    
                    <div className="absolute bottom-4 text-indigo-600 text-xs font-medium">
                        Click to learn more →
                    </div>
                </div>
            </motion.div>
        </>
    );
};

// Profile Image Component
const ProfileImage = ({ src, alt, size = "normal" }) => {
    const [isLoading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    
    const sizeClasses = size === "large" 
        ? "w-[160px] h-[160px] md:w-[180px] md:h-[180px]"
        : "w-[100px] h-[100px] md:w-[120px] md:h-[120px]";

    const defaultImage = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop";

    return (
        <div className={`${sizeClasses} overflow-hidden rounded-full border-4 border-white shadow-xl relative bg-slate-200`}>
            {!error && src ? (
                <img
                    className={cn(
                        "transition duration-300 absolute inset-0 w-full h-full object-cover",
                        isLoading ? "blur-sm" : "blur-0",
                    )}
                    onLoad={() => setLoading(false)}
                    onError={() => {
                        setError(true);
                        setLoading(false);
                    }}
                    src={src}
                    loading="lazy"
                    decoding="async"
                    alt={alt || "Team member"}
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-400 to-slate-600">
                    <User className="w-1/2 h-1/2 text-white" />
                </div>
            )}
        </div>
    );
};