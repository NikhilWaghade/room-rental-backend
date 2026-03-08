import { supabase } from "../config/supabase.js";
import { uploadImageToSupabase } from "../utils/imageUpload.js";

/* CREATE ROOM (MULTIPLE IMAGES) */

export const createRoom = async (req, res) => {
    try {

        const {
            title,
            description,
            price,
            city,
            location,
            room_type,
            furnished,
            owner_id
        } = req.body;

        const { data: roomData, error: roomError } = await supabase
            .from("rooms")
            .insert([
                {
                    title,
                    description,
                    price,
                    city,
                    location,
                    room_type,
                    furnished,
                    owner_id
                }
            ])
            .select()
            .single();

        if (roomError) {
            return res.status(400).json(roomError);
        }

        const roomId = roomData.id;
        const imageUrls = [];

        /* Upload Images */

        if (req.files && req.files.length > 0) {

            for (const file of req.files) {

                const imageUrl = await uploadImageToSupabase(file);

                imageUrls.push(imageUrl);

                await supabase
                    .from("room_images")
                    .insert([
                        {
                            room_id: roomId,
                            image_url: imageUrl
                        }
                    ]);
            }
        }

        res.json({
            message: "Room created successfully",
            room: roomData,
            images: imageUrls
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


/* GET ALL ROOMS */

export const getRooms = async (req, res) => {

    const { data, error } = await supabase
        .from("rooms")
        .select(`
      *,
      room_images(image_url)
    `);

    if (error) {
        return res.status(400).json(error);
    }

    res.json(data);
};


/* GET SINGLE ROOM */

export const getRoomById = async (req, res) => {

    const { id } = req.params;

    const { data, error } = await supabase
        .from("rooms")
        .select(`
      *,
      room_images(image_url)
    `)
        .eq("id", id)
        .single();

    if (error) {
        return res.status(400).json(error);
    }

    res.json(data);
};


/* DELETE ROOM */

export const deleteRoom = async (req, res) => {
    try {

        const { id } = req.params;

        /* Get room images */

        const { data: images, error: imageError } = await supabase
            .from("room_images")
            .select("*")
            .eq("room_id", id);

        if (imageError) {
            return res.status(400).json(imageError);
        }

        /* Extract filenames */

        const fileNames = images.map((img) => {
            const urlParts = img.image_url.split("/");
            return urlParts[urlParts.length - 1];
        });

        /* Delete from storage */

        if (fileNames.length > 0) {
            await supabase.storage
                .from("room-images")
                .remove(fileNames);
        }

        /* Delete image records */

        await supabase
            .from("room_images")
            .delete()
            .eq("room_id", id);

        /* Delete room */

        const { error: deleteError } = await supabase
            .from("rooms")
            .delete()
            .eq("id", id);

        if (deleteError) {
            return res.status(400).json(deleteError);
        }

        res.json({
            message: "Room and images deleted successfully"
        });

    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
};