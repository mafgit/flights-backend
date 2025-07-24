select f.id, f.departure_airport_id, f.arrival_airport_id, f.airline_id, f.status, f.arrival_time, f.departure_time,
	ap1.name as departure_airport_name,
	ap2.name as arrival_airport_name,
	al.name as airline_name,
	ap1.timezone as departure_timezone,
	ap2.timezone as arrival_timezone,
	extract(epoch from (f.arrival_time - f.departure_time)) / 3600 as duration,
	(
		2 * (ff.adult_base_amount + ff.tax_amount + ff.surcharge_amount)
		+ 1 * (ff.child_base_amount + ff.tax_amount + ff.surcharge_amount)
		+ 1 * (ff.infant_base_amount + ff.tax_amount + ff.surcharge_amount)
	) as segment_total_amount
from flights f
join airports ap1 on f.departure_airport_id = ap1.id
join airports ap2 on f.arrival_airport_id = ap2.id
join airlines al on f.airline_id = al.id
join flight_fares ff on ff.flight_id = f.id
join seats s on s.flight_id = f.id
where s.seat_class = 'economy' and s.is_available = true
	and f.status = 'scheduled'
	and departure_airport_id = 1 and arrival_airport_id = 2
	and f.departure_time >= '2025-08-01 00:00:00+05' and f.departure_time <= '2025-08-02 00:00:00+05'
group by f.id, ap1.name, ap2.name, al.name, ff.adult_base_amount, ff.tax_amount, ff.surcharge_amount, ff.child_base_amount, ff.infant_base_amount, ap1.timezone, ap2.timezone
order by segment_total_amount asc, duration asc
limit 10;