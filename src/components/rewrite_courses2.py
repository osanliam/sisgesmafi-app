import re

with open('CourseManager.jsx', 'r') as f:
    content = f.read()

# Indigo buttons/links
content = content.replace('bg-indigo-600 hover:bg-indigo-500', 'bg-kinetic-cyan hover:bg-cyan-400 text-slate-900 shadow-[0_0_15px_rgba(0,240,255,0.4)]')
content = content.replace('focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500', 'focus:border-kinetic-cyan focus:ring-1 focus:ring-kinetic-cyan')
content = content.replace('focus:border-indigo-500', 'focus:border-kinetic-cyan')
content = content.replace('focus:ring-indigo-500', 'focus:ring-kinetic-cyan')

content = content.replace('text-indigo-500', 'text-kinetic-cyan')
content = content.replace('text-indigo-600', 'text-kinetic-cyan')
content = content.replace('text-indigo-700', 'text-cyan-400')
content = content.replace('text-indigo-400', 'text-cyan-300')
content = content.replace('text-indigo-300', 'text-cyan-200')

content = content.replace('bg-indigo-50/50', 'bg-white/5')
content = content.replace('bg-indigo-50', 'bg-white/5')
content = content.replace('bg-indigo-100', 'bg-white/10')
content = content.replace('bg-indigo-500/10', 'bg-kinetic-cyan/20')

content = content.replace('border-indigo-100/10', 'border-kinetic-cyan/20')
content = content.replace('border-indigo-100/20', 'border-kinetic-cyan/20')

content = content.replace('hover:text-indigo-600', 'hover:text-kinetic-cyan')
content = content.replace('hover:text-indigo-500', 'hover:text-kinetic-cyan')
content = content.replace('hover:bg-indigo-100', 'hover:bg-kinetic-cyan/20')
content = content.replace('hover:bg-indigo-500', 'hover:bg-cyan-400')

content = content.replace('dark:bg-indigo-950/40', 'bg-white/5')
content = content.replace('dark:bg-indigo-900/60', 'hover:bg-white/10')
content = content.replace('dark:text-indigo-400', '')
content = content.replace('dark:text-indigo-300', '')

# Switch views logic
content = content.replace('bg-white dark:bg-slate-900 text-indigo-600 shadow', 'bg-kinetic-magenta text-white shadow-[0_0_10px_rgba(254,0,254,0.4)]')

# Slate backgrounds to dark themes
content = content.replace('bg-slate-50', 'bg-white/5')
content = content.replace('bg-slate-100', 'bg-white/10')
content = content.replace('bg-slate-200', 'bg-white/20')
content = content.replace('border-slate-100', 'border-white/10')
content = content.replace('border-slate-200', 'border-white/10')

content = content.replace('dark:bg-slate-800', '')
content = content.replace('dark:bg-slate-900', '')
content = content.replace('dark:border-slate-800', '')
content = content.replace('dark:border-slate-700', '')

content = content.replace('text-slate-900', 'text-white')
content = content.replace('text-slate-800', 'text-slate-200')
content = content.replace('text-slate-700', 'text-slate-300')
content = content.replace('text-slate-600', 'text-slate-400')

content = content.replace('bg-white', 'bg-transparent')
content = content.replace('bg-white/50', 'bg-white/5')

content = content.replace('text-slate-400 hover:text-indigo-500 hover:bg-slate-50', 'text-slate-400 hover:text-kinetic-cyan hover:bg-white/10')

with open('CourseManager.jsx', 'w') as f:
    f.write(content)
