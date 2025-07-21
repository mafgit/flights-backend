create type user_role as enum ('admin', 'user', 'super_admin');

create table users (
	id SERIAL PRIMARY KEY,
	full_name VARCHAR(100) NOT NULL,
	email VARCHAR(100) NOT NULL UNIQUE,
	role user_role DEFAULT 'user',
	-- airline_id INT REFERENCES airlines(id) NULL,
	password_hash VARCHAR(255) NOT NULL,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

create table airports (
	id SERIAL PRIMARY KEY,
	name VARCHAR(100) NOT NULL,
	code VARCHAR(30) NOT NULL,
	city VARCHAR(50) NOT NULL,
	country VARCHAR(50) NOT NULL,
	timezone VARCHAR(50) NOT NULL,
	latitude DECIMAL(9, 6) NOT NULL,
	longitude DECIMAL(9, 6) NOT NULL
);

create table airlines (
	id SERIAL PRIMARY KEY,
	name VARCHAR(100) NOT NULL,
	code VARCHAR(30) NOT NULL,
	country VARCHAR(50) NOT NULL,
	logo_url TEXT
);

create table aircrafts (
	id SERIAL PRIMARY KEY,
	model VARCHAR(100) NOT NULL,
	manufacturer VARCHAR(100) NOT NULL,
	capacity INT NOT NULL
);

create type flight_status as enum ('scheduled', 'cancelled', 'delayed', 'completed');

create table flights (
	id SERIAL PRIMARY KEY,
	flight_number VARCHAR(50) NOT NULL,
	airline_id INT REFERENCES airlines(id) NOT NULL,
	aircraft_id INT REFERENCES aircrafts(id) NOT NULL,
	departure_airport_id INT REFERENCES airports(id) NOT NULL,
	arrival_airport_id INT REFERENCES airports(id) NOT NULL,
	status flight_status NOT NULL,
	arrival_time TIMESTAMP WITH TIME ZONE NOT NULL,
	departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
	UNIQUE (flight_number, departure_airport_id, departure_time)
);

create type seat_class_enum as enum ('economy', 'premium', 'business', 'first');

create table flight_fares (
	id SERIAL PRIMARY KEY,
	flight_id INT REFERENCES flights(id),
	base_amount DECIMAL NOT NULL,
	surcharge_amount DECIMAL NOT NULL,
	tax_amount DECIMAL NOT NULL,
	total_amount DECIMAL NOT NULL,
	seat_class seat_class_enum NOT NULL,
	UNIQUE(flight_id, seat_class)
)
-- todo: adult etc fields


create table seats (
	id SERIAL PRIMARY KEY,
	flight_id INT REFERENCES flights(id),
	seat_number VARCHAR(15) NOT NULL,
	seat_class seat_class_enum NOT NULL,
	is_available BOOLEAN DEFAULT TRUE,
	UNIQUE (flight_id, seat_number)
);

create type gender_enum as enum ('m', 'f', 'x');

create table passengers (
	id SERIAL PRIMARY KEY,
	full_name VARCHAR(50) NOT NULL,
	gender gender_enum NOT NULL,
	passport_number VARCHAR(20) NOT NULL,
	nationality VARCHAR(30) NOT NULL,
	date_of_birth DATE NOT NULL
);


create type booking_status as enum ('pending', 'cancelled', 'delayed', 'completed');

create table bookings (
	id SERIAL PRIMARY KEY,
	user_id INT REFERENCES users(id),
	-- booking_code VARCHAR(100) UNIQUE NOT NULL,
	base_amount DECIMAL NOT NULL,
	surcharge_amount DECIMAL NOT NULL,
	tax_amount DECIMAL NOT NULL,
	total_amount DECIMAL NOT NULL,
	currency VARCHAR(30) NOT NULL,
	status booking_status DEFAULT 'pending',	
	created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

create type segment_status as enum ('confirmed', 'cancelled', 'flown', 'no_show');

create table booking_segments (
	id SERIAL PRIMARY KEY,
	booking_id INT REFERENCES bookings(id),
	passenger_id INT REFERENCES passengers(id),
	flight_id INT REFERENCES flights(id),
	seat_id INT REFERENCES seats(id),
	base_amount DECIMAL NOT NULL,
	surcharge_amount DECIMAL NOT NULL,
	tax_amount DECIMAL NOT NULL,
	total_amount DECIMAL NOT NULL,
	status segment_status DEFAULT 'confirmed'
);

create type payment_status as enum ('paid', 'pending', 'failed', 'refunded');
create type payment_method_enum as enum ('cash', 'credit_card', 'debit_card', 'wallet', 'bank_transfer');

create table payments (
	id SERIAL PRIMARY KEY,
	user_id INT REFERENCES users(id),
	booking_id INT REFERENCES bookings(id),
	total_amount DECIMAL NOT NULL,
	currency VARCHAR(30) NOT NULL,
	method payment_method_enum NOT NULL,
	status payment_status DEFAULT 'pending',
	created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);