import React from 'react';

interface UserAvatarProps {
  name?: string;
  avatar?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name = 'User',
  avatar,
  size = 'sm',
  className = '',
}) => {
  const isUrl = avatar && (avatar.startsWith('http://') || avatar.startsWith('https://'));

  const sizeClasses = {
    xs: 'w-4 h-4 text-[8px]',
    sm: 'w-5 h-5 text-[9px]',
    md: 'w-7 h-7 text-xs',
    lg: 'w-9 h-9 text-sm',
  }[size];

  const initial = (avatar && !isUrl ? avatar : name.charAt(0) || 'U').toUpperCase();

  if (isUrl) {
    return (
      <img
        src={avatar}
        alt={name}
        className={`${sizeClasses} rounded-full object-cover border border-white/10 shrink-0 ${className}`}
        onError={(e) => {
          // Fallback to initial if image fails to load
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  }

  // Generate deterministic subtle background tint from name
  const colors = [
    'bg-indigo-600/30 text-indigo-300 border-indigo-500/30',
    'bg-purple-600/30 text-purple-300 border-purple-500/30',
    'bg-sky-600/30 text-sky-300 border-sky-500/30',
    'bg-emerald-600/30 text-emerald-300 border-emerald-500/30',
    'bg-amber-600/30 text-amber-300 border-amber-500/30',
  ];
  const charCode = name.charCodeAt(0) || 0;
  const colorScheme = colors[charCode % colors.length];

  return (
    <div
      className={`${sizeClasses} rounded-full border flex items-center justify-center font-bold shrink-0 select-none ${colorScheme} ${className}`}
    >
      {initial}
    </div>
  );
};
