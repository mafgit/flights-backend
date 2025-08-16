-- clear bookings and payments etc:
-- truncate payments, bookings, booking_segments, passengers, carts, cart_segments;
-- update seats set is_available = true where is_available = false;

-- update dates of flights:
-- update flights set departure_time = departure_time + interval '15 days', arrival_time = arrival_time + interval '15 days';