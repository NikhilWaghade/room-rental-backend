import { supabase } from "../config/supabase.js";

/*
ADD REVIEW
POST /api/reviews
*/

export const addReview = async (req, res) => {
    try {
        const { room_id, user_id, rating, comment } = req.body;

        if (!room_id || !user_id || !rating) {
            return res.status(400).json({ message: "Required fields missing" });
        }

        const { data, error } = await supabase
            .from("reviews")
            .insert([
                {
                    room_id,
                    user_id,
                    rating,
                    comment,
                },
            ])
            .select();

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.status(201).json({
            message: "Review added successfully",
            review: data,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/*
GET REVIEWS BY ROOM
GET /api/reviews/:roomId
*/

export const getReviews = async (req, res) => {
    try {
        const { roomId } = req.params;

        const { data, error } = await supabase
            .from("reviews")
            .select(
                `
        id,
        rating,
        comment,
        created_at,
        users(name)
      `
            )
            .eq("room_id", roomId)
            .order("created_at", { ascending: false });

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};