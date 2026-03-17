import { supabase } from "../config/supabase.js";
import { v4 as uuidv4 } from "uuid";

export const uploadImageToSupabase = async (file) => {

    const fileExt = file.originalname.split(".").pop();

    const fileName = `${uuidv4()}.${fileExt}`;

    const { data, error } = await supabase.storage
        .from("room-images")
        .upload(fileName, file.buffer, {
            contentType: file.mimetype
        });

    if (error) throw error;

    const { data: publicUrl } = supabase.storage
        .from("room-images")
        .getPublicUrl(fileName);

    return publicUrl.publicUrl;

};