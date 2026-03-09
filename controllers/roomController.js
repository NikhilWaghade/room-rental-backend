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
    try {

        const {
            city,
            room_type,
            furnished,
            price_min,
            price_max,
            sort,
            page = 1,
            limit = 10
        } = req.query;

        const from = (page - 1) * limit;
        const to = from + Number(limit) - 1;

        let query = supabase
            .from("rooms")
            .select(`
        *,
        room_images(image_url)
      `, { count: "exact" });

        /* Filters */

        if (city) {
            query = query.ilike("city", `%${city}%`);
        }

        if (room_type) {
            query = query.eq("room_type", room_type);
        }

        if (furnished !== undefined) {
            query = query.eq("furnished", furnished === "true");
        }

        if (price_min) {
            query = query.gte("price", price_min);
        }

        if (price_max) {
            query = query.lte("price", price_max);
        }

        /* Sorting */

        if (sort === "price_asc") {
            query = query.order("price", { ascending: true });
        }

        if (sort === "price_desc") {
            query = query.order("price", { ascending: false });
        }

        /* Pagination */

        query = query.range(from, to);

        const { data, error, count } = await query;

        if (error) {
            return res.status(400).json(error);
        }

        const rooms = data.map(room => {
            const { room_images, ...rest } = room;

            return {
                ...rest,
                images: room_images.map(img => img.image_url)
            };
        });

        res.json({
            total: count,
            page: Number(page),
            limit: Number(limit),
            rooms
        });

    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
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

    if (error) return res.status(400).json(error);

    const room = {
        ...data,
        images: data.room_images.map(img => img.image_url)
    };

    res.json(room);
};


/* DELETE ROOM */

export const deleteRoom = async (req, res) => {

    const { id } = req.params;

    /* Get room */

    const { data: room } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", id)
        .single();

    if (!room) {
        return res.status(404).json({
            message: "Room not found"
        });
    }

    /* Ownership check */

    if (room.owner_id !== req.user.id) {
        return res.status(403).json({
            message: "You can delete only your own room"
        });
    }

    /* Delete room */

    await supabase
        .from("rooms")
        .delete()
        .eq("id", id);

    res.json({
        message: "Room deleted successfully"
    });

};

/* GET MY ROOMS (OWNER) */

export const getMyRooms = async (req, res) => {
    try {

        const ownerId = req.user.id;

        const { data, error } = await supabase
            .from("rooms")
            .select(`
        *,
        room_images(image_url)
      `)
            .eq("owner_id", ownerId);

        if (error) {
            return res.status(400).json(error);
        }

        const formattedRooms = data.map((room) => {
            const { room_images, ...rest } = room;

            return {
                ...rest,
                images: room_images.map((img) => img.image_url)
            };
        });

        res.json(formattedRooms);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* UPDATE ROOM */

export const updateRoom = async (req, res) => {
    try {

        const { id } = req.params;

        const {
            title,
            description,
            price,
            city,
            location,
            room_type,
            furnished
        } = req.body;

        /* Check room exists */

        const { data: room } = await supabase
            .from("rooms")
            .select("*")
            .eq("id", id)
            .single();

        if (!room) {
            return res.status(404).json({
                message: "Room not found"
            });
        }

        /* Ownership check */

        if (room.owner_id !== req.user.id) {
            return res.status(403).json({
                message: "You can update only your own room"
            });
        }

        /* Update room */

        const { data: updatedRoom, error } = await supabase
            .from("rooms")
            .update({
                title,
                description,
                price,
                city,
                location,
                room_type,
                furnished
            })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            return res.status(400).json(error);
        }

        /* Upload new images if provided */

        const newImages = [];

        if (req.files && req.files.length > 0) {

            for (const file of req.files) {

                const imageUrl = await uploadImageToSupabase(file);

                newImages.push(imageUrl);

                await supabase
                    .from("room_images")
                    .insert([
                        {
                            room_id: id,
                            image_url: imageUrl
                        }
                    ]);

            }

        }

        /* Fetch images */

        const { data: images } = await supabase
            .from("room_images")
            .select("image_url")
            .eq("room_id", id);

        const imageUrls = images.map(img => img.image_url);

        res.json({
            message: "Room updated successfully",
            room: updatedRoom,
            images: imageUrls
        });

    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
};

/* DELETE SINGLE IMAGE */

export const deleteRoomImage = async (req, res) => {
    try {

        const { imageId } = req.params;

        const { data: image } = await supabase
            .from("room_images")
            .select("*")
            .eq("id", imageId)
            .single();

        if (!image) {
            return res.status(404).json({
                message: "Image not found"
            });
        }

        const { data: room } = await supabase
            .from("rooms")
            .select("*")
            .eq("id", image.room_id)
            .single();

        if (room.owner_id !== req.user.id) {
            return res.status(403).json({
                message: "You can delete only your own room images"
            });
        }

        const fileName = image.image_url.split("/").pop();

        const { error: storageError } = await supabase.storage
            .from("room-images")
            .remove([fileName]);

        if (storageError) {
            console.log("Storage delete error:", storageError);
        }

        await supabase
            .from("room_images")
            .delete()
            .eq("id", imageId);

        res.json({
            message: "Image deleted successfully"
        });

    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
};