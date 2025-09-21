from django.core.management.base import BaseCommand
import os
import pandas as pd
from django.conf import settings

class Command(BaseCommand):
    help = 'Generate sample trading term sheet reference data for RAG testing'

    def handle(self, *args, **options):
        self.stdout.write('Generating sample trading term sheet reference data...')
        
        # Define the output path
        output_path = os.path.join(settings.BASE_DIR, 'data', 'term_sheet_reference.csv')
        
        # Ensure data directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Sample trading term sheets
        data = [
            {
                'id': 'T001',
                'trade_id': 'FX20240601',
                'trade_date': '2024-06-01',
                'reference_spot_price': '1.2250',
                'notional_amount': '1000000',
                'strike_price': '1.2350',
                'option_type': 'Call',
                'position_type': 'Buying',
                'expiry_date': '2024-09-01',
                'business_calendar': 'NYSE',
                'delivery_date': '2024-09-03',
                'premium_rate': '2.5%',
                'transaction_currency': 'USD',
                'counter_currency': 'EUR',
                'underlying_currency': 'EUR/USD'
            },
            {
                'id': 'T002',
                'trade_id': 'FX20240602',
                'trade_date': '2024-06-02',
                'reference_spot_price': '0.8750',
                'notional_amount': '2000000',
                'strike_price': '0.8700',
                'option_type': 'Put',
                'position_type': 'Selling',
                'expiry_date': '2024-10-02',
                'business_calendar': 'LSE',
                'delivery_date': '2024-10-04',
                'premium_rate': '1.8%',
                'transaction_currency': 'GBP',
                'counter_currency': 'USD',
                'underlying_currency': 'GBP/USD'
            },
            {
                'id': 'T003',
                'trade_id': 'FX20240605',
                'trade_date': '2024-06-05',
                'reference_spot_price': '135.50',
                'notional_amount': '5000000',
                'strike_price': '137.00',
                'option_type': 'Call',
                'position_type': 'Buying',
                'expiry_date': '2024-08-05',
                'business_calendar': 'TSE',
                'delivery_date': '2024-08-07',
                'premium_rate': '3.2%',
                'transaction_currency': 'JPY',
                'counter_currency': 'USD',
                'underlying_currency': 'USD/JPY'
            },
            {
                'id': 'T004',
                'trade_id': 'FX20240610',
                'trade_date': '2024-06-10',
                'reference_spot_price': '1.0850',
                'notional_amount': '3000000',
                'strike_price': '1.0800',
                'option_type': 'Put',
                'position_type': 'Buying',
                'expiry_date': '2024-12-10',
                'business_calendar': 'NYSE',
                'delivery_date': '2024-12-12',
                'premium_rate': '2.1%',
                'transaction_currency': 'EUR',
                'counter_currency': 'USD',
                'underlying_currency': 'EUR/USD'
            },
            {
                'id': 'T005',
                'trade_id': 'FX20240615',
                'trade_date': '2024-06-15',
                'reference_spot_price': '0.9250',
                'notional_amount': '1500000',
                'strike_price': '0.9300',
                'option_type': 'Call',
                'position_type': 'Selling',
                'expiry_date': '2024-09-15',
                'business_calendar': 'SIX',
                'delivery_date': '2024-09-17',
                'premium_rate': '1.5%',
                'transaction_currency': 'CHF',
                'counter_currency': 'USD',
                'underlying_currency': 'USD/CHF'
            }
        ]
        
        # Create DataFrame and save to CSV
        df = pd.DataFrame(data)
        df.to_csv(output_path, index=False)
        
        self.stdout.write(self.style.SUCCESS(f'Sample trading reference data generated successfully at {output_path}')) 