import { supabase } from "../config/supabase.js";

export const uploadImageToSupabase = async (file) => {
    const fileName = `${Date.now()}-${file.originalname}`;

    const { error } = await supabase.storage
        .from("room-images")
        .upload(fileName, file.buffer, {
            contentType: file.mimetype
        });

    if (error) {
        throw error;
    }

    const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/room-images/${fileName}`;

    return publicUrl;
};