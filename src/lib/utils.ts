
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to format location string
export const formatLocation = (location: string): string => {
    if (!location) return "Ubicación no disponible";
    const parts = location.split(',').map(part => part.trim());
    // Prioritize taking the first two parts if available (likely street and neighborhood)
    if (parts.length >= 2) {
        // Check if the first part looks like coordinates, if so, return the original string
        if (/^Lat: .+ Lon: .+$/.test(parts[0])) {
           return location;
        }
        return `${parts[0]}, ${parts[1]}`;
    }
    // Fallback to the original string if fewer than two parts
    return location;
};
