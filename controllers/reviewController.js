import { supabase } from "../config/supabase.js";

/*
ADD REVIEW
POST /api/reviews/:roomId
*/

export const addReview = async (req, res) => {
    try {

        const { roomId } = req.params;
        const { rating, comment } = req.body;

        const userId = req.user.id;

        if (!rating) {
            return res.status(400).json({
                message: "Rating is required"
            });
        }

        /* Check room exists */

        const { data: room } = await supabase
            .from("rooms")
            .select("id")
            .eq("id", roomId)
            .single();

        if (!room) {
            return res.status(404).json({
                message: "Room not found"
            });
        }

        /* Prevent duplicate review */

        const { data: existingReview } = await supabase
            .from("reviews")
            .select("*")
            .eq("room_id", roomId)
            .eq("user_id", userId)
            .single();

        if (existingReview) {
            return res.status(400).json({
                message: "You have already reviewed this room"
            });
        }

        /* Insert review */

        const { data, error } = await supabase
            .from("reviews")
            .insert([
                {
                    room_id: roomId,
                    user_id: userId,
                    rating,
                    comment
                }
            ])
            .select()
            .single();

        if (error) {
            return res.status(500).json({
                error: error.message
            });
        }

        res.status(201).json({
            message: "Review added successfully",
            review: data
        });

    } catch (err) {
        res.status(500).json({
            error: err.message
        });
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
            .select(`
        id,
        rating,
        comment,
        created_at,
        users(name)
      `)
            .eq("room_id", roomId)
            .order("created_at", { ascending: false });

        if (error) {
            return res.status(500).json({
                error: error.message
            });
        }

        res.json(data);

    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
};