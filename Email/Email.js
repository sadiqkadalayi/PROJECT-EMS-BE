export const Eid_Email_Template = `
<!DOCTYPE html>
<html>
<head>
    <title>Eid Mubarak</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f9f9f9;
            color: #333;
            padding: 20px;
        }
        .email-container {
            background-color: #fff;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        .logo {
            max-width: 150px; /* Adjust logo size */
            margin-bottom: 20px;
        }
        .greeting {
            color: #2a9d8f;
            font-size: 24px;
            font-weight: bold;
        }
        .message {
            margin-top: 10px;
            font-size: 16px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Logo at the top -->
        <h1>Panda.qa</h1>
        
        <p class="greeting">Eid Mubarak, {{name}}!</p>
        <p class="message">
            May this Eid bring joy, peace, and prosperity to you and your family.
            Celebrate this festive season with love and happiness. Wishing you all the best!
        </p>
        <p style="margin-top: 20px;">Warm regards,<br>Pand Hypermarket</p>
    </div>
</body>
</html>

`;