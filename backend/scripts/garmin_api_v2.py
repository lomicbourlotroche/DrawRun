        # Compact format if requested
        if args.format == 'compact':
            if 'activities' in result['data']:
                result['data']['activities'] = [
                    {k: v for k, v in a.items() if k != 'raw_data'}
                    for a in result['data']['activities']
                ]
        
        print(json.dumps(result, default=str))
        sys.exit(0)
        
    except Exception as e:
        error_msg = str(e)
        error_data = {
            "success": False,
            "error": error_msg,
            "timestamp": datetime.now().isoformat()
        }
        
        # Try to parse structured error
        try:
            if error_msg.startswith('{'):
                parsed = json.loads(error_msg)
                error_data.update(parsed)
        except:
            pass
        
        print(json.dumps(error_data))
        sys.exit(1)


if __name__ == '__main__':
    main()
