import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { method } = req;
    const url = new URL(req.url);
    const path = url.pathname;

    console.log(`${method} ${path}`);

    if (method === 'POST' && path.includes('initiate')) {
      return await initiatePayment(req, supabase);
    } else if (method === 'POST' && path.includes('callback')) {
      return await handleMpesaCallback(req, supabase);
    } else if (method === 'GET' && path.includes('status')) {
      return await checkPaymentStatus(req, supabase);
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function initiatePayment(req: Request, supabase: any) {
  try {
    const body = await req.json();
    const { phoneNumber, amount, userId, planId } = body;

    console.log('Initiating payment:', { phoneNumber, amount, userId, planId });

    // Validate input
    if (!phoneNumber || !amount || !userId || !planId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format phone number
    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (!formattedPhone) {
      return new Response(
        JSON.stringify({ error: 'Invalid phone number format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create payment record
    const paymentId = crypto.randomUUID();
    const referenceId = `SUB-${Date.now()}`;

    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        id: paymentId,
        user_id: userId,
        amount: amount,
        phone_number: formattedPhone,
        reference_id: referenceId,
        description: `Professional subscription payment`,
        payment_status: 'pending'
      });

    if (paymentError) {
      console.error('Payment record creation error:', paymentError);
      return new Response(
        JSON.stringify({ error: 'Failed to create payment record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For demo purposes, we'll simulate a successful payment initiation
    // In production, integrate with actual MPesa API
    const checkoutRequestId = `ws_CO_${Date.now()}`;

    const { error: updateError } = await supabase
      .from('payments')
      .update({ checkout_request_id: checkoutRequestId })
      .eq('id', paymentId);

    if (updateError) {
      console.error('Payment update error:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentId,
        checkoutRequestId,
        message: 'Payment initiated successfully. Please complete payment on your phone.'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Payment initiation error:', error);
    return new Response(
      JSON.stringify({ error: 'Payment initiation failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleMpesaCallback(req: Request, supabase: any) {
  try {
    const body = await req.json();
    console.log('MPesa callback received:', body);

    // For demo purposes, simulate successful payment
    // In production, parse actual MPesa callback data
    const { checkoutRequestId, paymentId, mpesaReceiptNumber = `TEST${Date.now()}` } = body;

    if (!checkoutRequestId && !paymentId) {
      return new Response(
        JSON.stringify({ ResultCode: 1, ResultDesc: 'Missing payment identifier' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update payment status
    let query = supabase.from('payments').update({
      payment_status: 'completed',
      mpesa_receipt_number: mpesaReceiptNumber
    });

    if (checkoutRequestId) {
      query = query.eq('checkout_request_id', checkoutRequestId);
    } else {
      query = query.eq('id', paymentId);
    }

    const { data: paymentData, error: paymentError } = await query.select().single();

    if (paymentError) {
      console.error('Payment update error:', paymentError);
      return new Response(
        JSON.stringify({ ResultCode: 1, ResultDesc: 'Payment update failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the professional plan ID
    const { data: planData, error: planError } = await supabase
      .from('subscription_plans')
      .select('id')
      .eq('name', 'Professional')
      .single();

    if (planError || !planData) {
      console.error('Plan fetch error:', planError);
      return new Response(
        JSON.stringify({ ResultCode: 1, ResultDesc: 'Plan not found' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create or update user subscription
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month subscription

    const { error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: paymentData.user_id,
        plan_id: planData.id,
        status: 'active',
        starts_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        payment_method: 'mpesa'
      }, {
        onConflict: 'user_id'
      });

    if (subscriptionError) {
      console.error('Subscription creation error:', subscriptionError);
    }

    // Link payment to subscription
    const { error: linkError } = await supabase
      .from('payments')
      .update({ subscription_id: paymentData.id })
      .eq('id', paymentData.id);

    if (linkError) {
      console.error('Payment link error:', linkError);
    }

    console.log('Payment processed successfully for user:', paymentData.user_id);

    return new Response(
      JSON.stringify({ ResultCode: 0, ResultDesc: 'Payment processed successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Callback processing error:', error);
    return new Response(
      JSON.stringify({ ResultCode: 1, ResultDesc: 'Callback processing failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function checkPaymentStatus(req: Request, supabase: any) {
  try {
    const url = new URL(req.url);
    const paymentId = url.searchParams.get('paymentId');
    const checkoutRequestId = url.searchParams.get('checkoutRequestId');

    if (!paymentId && !checkoutRequestId) {
      return new Response(
        JSON.stringify({ error: 'Payment ID or checkout request ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let query = supabase.from('payments').select('*');
    
    if (paymentId) {
      query = query.eq('id', paymentId);
    } else {
      query = query.eq('checkout_request_id', checkoutRequestId);
    }

    const { data, error } = await query.single();

    if (error) {
      console.error('Payment status check error:', error);
      return new Response(
        JSON.stringify({ error: 'Payment not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment: data
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Status check error:', error);
    return new Response(
      JSON.stringify({ error: 'Status check failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

function formatPhoneNumber(phone: string): string | null {
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Handle different formats
  if (cleanPhone.startsWith('254') && cleanPhone.length === 12) {
    return cleanPhone;
  } else if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
    return '254' + cleanPhone.substring(1);
  } else if (cleanPhone.length === 9) {
    return '254' + cleanPhone;
  }
  
  return null;
}